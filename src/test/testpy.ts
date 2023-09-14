import { apiExe } from '../libs/commonApi';

async function runHello (){
    const fileUri = 'D:/work/projects/visualcli/testpy/hello.py'
    console.log('run:', fileUri)
	const result = await apiExe('python',
	{
		script: fileUri,
	})
	console.log('result:', result)
}

async function runArgv (){
    const fileUri = 'D:/work/projects/visualcli/testpy/argv.py'
    console.log('run:', fileUri)
	const result = await apiExe('python',
	{
		script: fileUri,
        options: {
            args: ['abb', 'ccd']
        }
	})
	console.log('result:', result)
}

async function runArgparse (){
    const fileUri = 'D:/work/projects/visualcli/testpy/argparsetest.py'
    console.log('run:', fileUri)
    try {
        const result = await apiExe('python',
        {
            script: fileUri,
            options: {
                args: ['--name=hhh', '--age=15']
            }
        })
        console.log('result:', result)
    } catch (e) {
        console.log('e:', e)
    }
}

async function runPy(scriptName: string) {
    const fileUri = `D:/work/projects/visualcli/testpy/${scriptName}.py`
    console.log('run:', fileUri)
    // try {
        const result = await apiExe('python',
        {
            script: fileUri
        })
        console.log(scriptName+':result:', result)
    // } catch (e) {
    //     console.log('typeof e:', typeof e)
    //     console.log('e:', e)
    // }
}

export const testAll =async () => {
    await runHello();
    await runArgv();
    await runArgparse();
    await runPy('error');
    await runPy('echo_hi_then_error');
    await runPy('echo_json');
    await runPy('stderrLogging');
    await runPy('stderrLogging');
    await runPy('echo_text_with_newline_control');
    await runPy('exit-code');
    
}
