// -*- coding: utf-8 -*-
/** @module type */
'use strict'
/* !
    region header
    [Project page](https://torben.website/storelocator)

    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import PropertyTypes from 'clientnode/property-types'
import {
    Mapping, ObjectMaskConfiguration, PlainObject, RecursivePartial, ValueOf
} from 'clientnode/type'
import {
    RequestInit as FetchOptions,
    Response as FetchResponse,
    RequestCache,
    RequestCredentials,
    RequestMode
} from 'node-fetch'
import {Model as BaseModel} from 'web-input-material/type'
// endregion
declare global {
    interface Window {
        dataLayer:Array<any>
    }
}
export type Model<Type = any> =
    Omit<RecursivePartial<BaseModel<Type>>, 'value'> &
    {
        dataMapping?:Mapping|string
        dependsOn:Array<string>|null
        dynamicExtend?:Mapping<(event:Event) => any>
        dynamicExtendExpressions?:Mapping<((event:Event, scope:any) => any)|string>
        eventChangedName:string
        showIf?:() => boolean
        showIfExpression?:string
        shown?:boolean
        target?:string
        transformer?:(value:any) => any
        transformerExpression?:string
        value:null|Type
        valuePersistence?:'persistent'|'resetOnHide'
    }
export type Action = {
    code:string
    indicator:() => any
    name:string
    target:string
}
export type Constraint = {
    description:string
    evaluation:string
}
export type TargetConfiguration = {
    options:FetchOptions & Partial<{
        cache:RequestCache
        credentials:RequestCredentials
        headers:Mapping
        mode:RequestMode
    }>
    url:string
}
export type Configuration = {
    actions:Mapping<Action>
    animation:boolean
    constraints:Array<Constraint>
    conversionValue:{
        submit:number
        successful:number
    }
    data:null|PlainObject
    debug:boolean
    evaluations:Array<[string, () => any]>
    eventNameMapping:Mapping
    expressions:Array<[string, string]>
    initializeTarget:TargetConfiguration
    model:Mapping<Model>
    name:string
    offsetInPixel:number
    reCaptcha:{
        key:{
            v2:string
            v3:string
        }
        options:PlainObject
        secret:string
        skip:boolean
        token:string
    }
    responseDataWrapperSelector:{
        optional:boolean
        path:string
    }
    securityResponsePrefix:string
    selector:{
        clearButtons:string
        groups:string
        inputs:string
        reCaptchaFallbackInput:string
        resetButtons:string
        spinner:string
        statusMessageBoxes:string
        submitButtons:string
        truncateButtons:string
    }
    showAll:boolean
    tag:{
        secret:string
        values:Array<string>
    }
    target:TargetConfiguration
    targetData:null|PlainObject
    urlModelMask:ObjectMaskConfiguration
    version:number
}
export type PropertyTypes = {
    baseConfiguration:ValueOf<typeof PropertyTypes>
    configuration:ValueOf<typeof PropertyTypes>
    dynamicConfiguration:ValueOf<typeof PropertyTypes>
}
export type AnnotatedDomNode<Type = any> = HTMLElement & {
    changeTrigger?:Function
    clearFading?:Function
    invalid:boolean
    model:Model<Type>
    showInitialValidationState:boolean
    shown:boolean
    valid:boolean
    value:any
}
export type Response = FetchResponse & {data:PlainObject}
export type ResponseResult = {data:PlainObject;invalidInputNames:Array<string>}
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
