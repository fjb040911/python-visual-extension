declare namespace API {
    interface IMessage {
        id?: string,
        method?: string,
        data?: any,
        notification?: boolean,
        response?: boolean,
        request?: boolean,
    }

    interface Collections {
        [key: string]: string;
        VISUALCLI: string;
    }

    interface IExeData {
        script: string,
        formData?: any,
        options?: any
    }

    interface DebugWebView {
        title?: string;
        url: string
    }
    interface Ieform {
        layout?: Array<any>,
        defaultValues?: any
    }

    interface IoptionsSetting {
        formItemName: string,
        dataFrom: any
    }

    interface IfuncJson {
        id: string,
        type: string,
        path: string,
        arg?: any,
        button?: any
    }

    interface Isolution {
        _id?: string,
        name: string,
        eformData?: Ieform,
        formOptionsSetting?: Array<IoptionsSetting>,
        executionList: Array<IfuncJson>
    }
}
