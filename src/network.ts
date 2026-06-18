import Taro from '@tarojs/taro'

/**
 * 网络请求模块
 * 通过云函数代理调用后端 API，绕过微信小程序域名白名单限制
 */
export namespace Network {
    export const request = async (option: {
        url: string
        method?: string
        data?: any
        [key: string]: any
    }) => {
        try {
            const result = await Taro.cloud.callFunction({
                name: 'apiProxy',
                data: {
                    path: option.url,
                    method: option.method || 'GET',
                    data: option.data || {}
                }
            })
            
            return {
                data: result.result,
                statusCode: 200
            }
        } catch (error) {
            console.error('Cloud Function Error:', error)
            throw error
        }
    }

    export const uploadFile = async (option: {
        url: string
        filePath: string
        name: string
        [key: string]: any
    }) => {
        return Taro.uploadFile({
            url: `${PROJECT_DOMAIN}${option.url}`,
            filePath: option.filePath,
            name: option.name
        })
    }

    export const downloadFile = async (option: {
        url: string
        [key: string]: any
    }) => {
        return Taro.downloadFile({
            url: `${PROJECT_DOMAIN}${option.url}`
        })
    }
}