export interface AppObj {
    "applications": [
        {
            "clusterList": [
                {
                    "description": string;
                    "icon": string;
                    "labels": {
                        [proppName: string]: string;
                    },
                    "name": string;
                    "reason": string;
                    "status": string;
                }
            ],
            "createTime": string;
            "description": string;
            "gatewayRule": [
                {
                    "address": string;
                    "componentName": string;
                    "componentPort": number;
                    "protocol": string;
                    "ruleType": string;
                }
            ],
            "icon": string;
            "labels": {
                [proppName: string]: string;
            },
            "name": string;
            "btnContent": string;
            "namespace": string;
            "status": string;
            "updateTime": string;
        }
    ]
};

export interface Applications {
    code: number | string;
    data: AppObj;
    msg: string;
}

export interface AppContent {
    name: string,
    btnContent: string,
    status: string,
    icon: string,
    description: string,
    createTime: string,
    href: string
}