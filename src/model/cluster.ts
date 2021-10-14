interface clusterObj {
    "applications": [
        {
            "clusterList": [
                {
                    "description": "string",
                    "icon": "string",
                    "labels": {
                        "additionalProp1": "string",
                        "additionalProp2": "string",
                        "additionalProp3": "string"
                    },
                    "name": "string",
                    "reason": "string",
                    "status": "string"
                }
            ],
            "createTime": "string",
            "description": "string",
            "gatewayRule": [
                {
                    "address": "string",
                    "componentName": "string",
                    "componentPort": 0,
                    "protocol": "string",
                    "ruleType": "string"
                }
            ],
            "icon": "string",
            "labels": {
                "additionalProp1"?: "string",
                "additionalProp2"?: "string",
                "additionalProp3"?: "string"
            },
            "name": "string",
            "btnContent": "string",
            "namespace": "string",
            "status": "string",
            "updateTime": "string"
        }
    ]
};

export interface Clusters {
    "code": number | string;
    "data": clusterObj;
    "msg": string;
}

export interface AppContent {
    "name": "string",
    "btnContent": "string",
    "status": "string",
    "icon": "string",
    "description": "string",
    "createTime": "string",
    "href": "string"
}