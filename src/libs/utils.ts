import { Webview, Uri, workspace } from "vscode";
import * as path from 'path';
import { platform } from 'node:process';
import { get, set, findIndex, cloneDeep, keys } from "lodash";
import { apiExe } from "./commonApi";

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function fixDynamicsSrc(html: string, assetManifest: any){
    for(let scripName in assetManifest) {
        if(scripName.endsWith('.js')) {
            html = html.replace(scripName, assetManifest[scripName]);
        }
    }
    return html;
}

/**
   * 替换 href="./file" or src="./file" 并且找到静态资源
   */
export function fixResourceReferences(html: string, resourceRootDir: string, webview: Webview): string {
    // const refRegex = /((href)|(src))="(\.\/[^"]+)"/g;
    const refRegex = /((href)|(src))="([^"]+)"/g;
    let refMatch;
    while ((refMatch = refRegex.exec(html)) !== null) {
        const offset = refMatch.index;
        const length = refMatch[0].length;
        const refAttr = refMatch[1];
        const refName = refMatch[4];
        const refPath = path.join(resourceRootDir, refName);
        const refUri = webview.asWebviewUri(Uri.file(refPath));
        const refReplace = refAttr + "=\"" + refUri + "\"";
        html = html.slice(0, offset) + refReplace + html.slice(offset + length);
    }
    return html;
}

/**
 * 替换 ${webview.cspSource} .
 */
export function fixCspSourceReferences(html: string, webview: Webview): string {
    const cspSourceRegex = /\${webview.cspSource}/g;
    let cspSourceMatch;
    while ((cspSourceMatch = cspSourceRegex.exec(html)) !== null) {
        html = html.slice(0, cspSourceMatch.index) + webview.cspSource +
            html.slice(cspSourceMatch.index + cspSourceMatch[0].length);
    }

    return html;
}

export function responseData(id: string, data: any, ok: boolean){
    return {
        response: true,
        id,
        data,
        ok
    }
}

export function notificationData(method: string, data: any){
    return {
        notification: true,
        method,
        data
    }
}

// export function csvJSON(csv: string){

//     var lines=csv.split("\n");
  
//     var result = [];
  
//     var headers=lines[0].split(",");
  
//     for(var i=1;i<lines.length;i++){
  
//         var obj = {};
//         var currentline=lines[i].split(",");
  
//         for(var j=0;j<headers.length;j++){
//             obj[headers[j] as keyof typeof obj] = currentline[j];
//         }
  
//         result.push(obj);
  
//     }
    
//     //return result; //JavaScript object
//     return JSON.stringify(result); //JSON
//   }

function convertJsonToCsv(json: any) {
    const keys = Object.keys(json[0]);
    const rows = json.map((row: any) => keys.map(k => row[k]).join(','));
    return [keys.join(','), ...rows].join('\n');
}

function isWindows() {
  console.log(`This platform is ${platform}`);
  return 'win32' === platform
}

/**
 * 格式化路径
 * @param uri 
 */
export function formartUri(uri: string){
    if(isWindows()) {
        if(uri.startsWith('/')){
            return uri.substring(1);
        }
    }
    return uri
}

export const formartEfromLayout = async (solution: API.Isolution) => {
    console.log('solutionobj:', solution)
    let eformLayout = cloneDeep(get(solution, 'eformData', []));
    console.log('solution:', solution.formOptionsSetting)
    console.log('eformLayout:', eformLayout)
    if (solution.formOptionsSetting) {
        // 存在需要脚本获取的选项
        for(let i in solution.formOptionsSetting) {
            // 获取生效的策略
            const enableIndex = findIndex(solution.formOptionsSetting[i].scheme, (item: any)=>item.enable);
            const formItemName = solution.formOptionsSetting[i].formItemId;
            if(enableIndex !== -1) {
                let optionsValue = [];
                const optionsType = get(solution.formOptionsSetting[i].scheme, [enableIndex, 'type']);
                if(optionsType === 'Scoped') {
                    // 指定的选项
                    optionsValue = get(solution.formOptionsSetting[i].scheme, [enableIndex, 'data']);
                } else if (optionsType === 'Script') {
                    // 从python脚本取
                    const ioptions = await apiExe('python', {
                        script: formartUri(get(solution.formOptionsSetting[i].scheme, [enableIndex, 'data', 'path']))
                    })
                    console.log('ioptions=', ioptions);
                    try{
                        optionsValue = JSON.parse(get(ioptions, 0, '[]'));
                    } catch (error) {
                        console.error('GET options error:',error);
                    }
                }

                console.log('optionsValue**********', optionsValue)
                if(formItemName.indexOf('.')!==-1) {
                    // 说明是 group下面的组件
                    const nameArray = formItemName.split('.');
                    const itemIndex = findIndex(eformLayout, item=>item.id===nameArray[0]);
                    if(itemIndex!==-1) {
                        const subIndex = findIndex(eformLayout[itemIndex].children, (item: any)=>item.id===nameArray[1]);
                        if(subIndex!==-1) {
                            eformLayout = set(eformLayout, `[${itemIndex}].children[${subIndex}].privateProps.options`, optionsValue);
                        }   
                    }
                } else {
                    const itemIndex = findIndex(eformLayout, item=>item.id===formItemName);
                    if(itemIndex!==-1) {
                        eformLayout = set(eformLayout, `[${itemIndex}].privateProps.options`, optionsValue);
                    }
                }

            }
        }
    }
    return eformLayout;
}

/**
 * json转换成扁平化的数据结构
 * 迭代2层
 * @param {*} jsonData 
 */
export const jsonToFormData = (jsonData: any, separator='.')=>{
    const fkeys = keys(jsonData)
    let resut: any = {};
    for(let i = 0; i<fkeys.length; i++) {
      const temp = jsonData[fkeys[i]];
      const iType = typeof temp;
      if(!temp || iType ==='string' || iType === 'number' || Array.isArray(temp) || iType === 'boolean') {
        // 这几类可以不用继续迭代
        resut = set(resut, fkeys[i], temp);
      } else if(iType === 'object') {
        // 再迭代一层
        const subkeys = keys(temp)
        for(let p = 0; p<subkeys.length; p++) {
          resut[`${fkeys[i]}${separator}${subkeys[p]}`] = temp[subkeys[p]];
        }
      }
    }
    return resut;
};

export const getExt = (filePath: string) => {
    const index= filePath.lastIndexOf(".");
    //获取后缀
    return filePath.substring(index+1);
};

export const isAssetTypeAnImage = (ext: string) => {
    return [
    'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].
    indexOf(ext.toLowerCase()) !== -1;
};

export const isImg = (filePath: string) => {
    const ext = getExt(filePath);
    return isAssetTypeAnImage(ext);
};
