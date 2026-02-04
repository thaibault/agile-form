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
import {
    Mapping,
    ObjectMaskConfiguration,
    PlainObject,
    Primitive,
    ProcedureFunction,
    RecursiveEvaluateable,
    RecursivePartial,
    ValueOf
} from 'clientnode'
import PropertyTypes from 'clientnode/property-types'
import 'grecaptcha'
import {BaseModel} from 'web-input-material/type'
// endregion
declare global {
    interface Window {
        dataLayer: Array<unknown>
    }
}

export type IndicatorFunction = (...parameters: Array<unknown>) => boolean

export type DynamicExtendExpression =
    ((event: Event, scope: unknown) => unknown) | string

export interface Model<T = unknown> extends BaseModel<T> {
    default?: T
    dynamicExtendExpressions?: Mapping<DynamicExtendExpression>
}
export interface InputConfiguration<Type = unknown> {
    changedEventName?: string

    dependsOn?: Array<string> | null

    domNode?: AnnotatedInputDomNode
    domNodes: Array<AnnotatedInputDomNode>

    dynamicExtend?: Mapping<(event: Event) => unknown>
    dynamicExtendExpressions?: Mapping<DynamicExtendExpression>

    name: string
    properties: Partial<InputAnnotation<Type>>

    serializer?: (value: unknown) => Primitive
    serializerExpression?: string

    showIf?: IndicatorFunction
    showIfExpression?: string
    shown?: boolean

    target?: string

    dataMapping?: Mapping | string
    transformer?: (value: unknown) => unknown
    transformerExpression?: string

    value?: null | Type
    valuePersistence?: 'persistent' | 'resetOnHide'
}

export interface Annotation {
    clearFading?: ProcedureFunction

    oldDisplay?: string
    oldOpacity?: number

    reason: null | Array<string> | string

    showIf?: IndicatorFunction
    showIfExpression?: string
    shown: boolean
}
export interface InputAnnotation<Type = unknown> {
    changeTrigger?: unknown

    type: string
    default: Type
    initialValue?: Type
    selection: Array<Type>
    value: Type

    dirty: boolean
    invalid: boolean
    pristine: boolean
    valid: boolean

    showInitialValidationState: boolean

    disabled: boolean
    model?: RecursivePartial<Model<Type>>
    required?: boolean

    dynamicExtendExpressions?: Mapping<DynamicExtendExpression>

    externalProperties?: Partial<InputAnnotation<Type>>
}
export type AnnotatedDomNode = HTMLElement & Annotation
export type AnnotatedInputDomNode<Type = unknown> =
    AnnotatedDomNode & Partial<InputAnnotation<Type>>
export interface GroupSpecification {
    childs: Array<AnnotatedInputDomNode>

    showIf?: IndicatorFunction
    showIfExpression?: string
    showReason?: Array<AnnotatedDomNode> | null | string
}

export interface Action {
    name: string

    event?: string
    handler: (event: Event) => void

    domNodes?: Array<HTMLElement>
    determinedDomNodes: Array<HTMLElement>
    globalSelectors?: Array<string>
    localSelectors?: Array<string>

    code: string
    run?: (event: Event, action: Action) => unknown
}
export interface TargetAction {
    name: string
    target: string

    code: string
    indicator?: () => unknown
}

export interface Constraint {
    description: string
    evaluation: string
}

export interface StateURL {
    encoded: string
    plain: string
}

export interface TargetConfiguration {
    options?: (
        RequestInit &
        Partial<{
            cache: 'default' | 'reload' | 'no-cache'
            credentials: 'omit' | 'same-origin' | 'include'
            headers: Headers | Mapping | null
            mode: 'cors' | 'no-cors' | 'same-origin' | 'navigate'
        }>
    ) |
    null
    url: string
}

export type Evaluation = [string, unknown]
export type GivenEvaluation = Evaluation | Mapping<unknown>
export interface GivenNamedEvaluations {
    evaluations: Array<GivenEvaluation> | GivenEvaluation
    order: number
}
export type GivenEvaluations =
    Array<GivenEvaluation> |
    GivenEvaluation |
    GivenNamedEvaluations

export interface Configuration {
    name: string

    actions: Mapping<Action>
    targetActions: Mapping<TargetAction>

    changedEventNameMapping: Mapping & {default: string},

    constraints: Array<Constraint>
    evaluations: GivenEvaluations

    animation: boolean

    data: null | Mapping<unknown>

    debug: boolean

    initializeTarget: TargetConfiguration
    inputs: Mapping<Partial<InputConfiguration>>

    offsetInPixel: number

    reCaptcha: {
        action: ReCaptchaV2.Action
        key: {
            v2: ReCaptchaV2.Parameters['sitekey']
            v3: string
        }
        secret: string
        skip: boolean
        token: string
    }

    responseDataWrapperSelector: {
        optional: boolean
        path: string
    }
    securityResponsePrefix: string

    selector: {
        clearButtons: string
        groups: string
        inputs: string
        reCaptchaFallbackInput: string
        resetButtons: string
        spinner: string
        statusMessageBoxes: string
        submitButtons: string
        truncateButtons: string
    }

    showAll: boolean

    tag: {
        secret: string
        values: Array<string> | string
    }
    tags?: Array<string> | string

    target: RecursiveEvaluateable<TargetConfiguration>
    targetData: null | Mapping<unknown>

    urlConfigurationMask: ObjectMaskConfiguration
    urlConfigurationCharacterLimit: number

    version: number
}
export type NormalizedConfiguration =
    Omit<
        RecursivePartial<Configuration>,
        'evaluations' | 'expressions' | 'tag' | 'tags'
    > &
    {
        evaluations: Array<Evaluation>
        tag: {
            secret: string
            values: Array<string>
        }
    }

export interface PropertyTypes {
    baseConfiguration: ValueOf<typeof PropertyTypes>
    configuration: ValueOf<typeof PropertyTypes>
    dynamicConfiguration: ValueOf<typeof PropertyTypes>
}

export type FormResponse = Response & {data: null | PlainObject}
export interface ResponseResult {
    data: Mapping<unknown>
    invalidInputNames: Array<string>
}
