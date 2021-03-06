// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
/** @module agile-form */
'use strict'
/* !
    region header
    [Project page](https://torben.website/agile-form)

    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import Tools from 'clientnode'
import {
    CompilationResult,
    EvaluationResult,
    Mapping,
    Offset,
    PlainObject,
    ProcedureFunction,
    RecursiveEvaluateable,
    TemplateFunction,
    ValueOf
} from 'clientnode/type'
import {object} from 'clientnode/property-types'
import FetchType from 'node-fetch'
import property from 'web-component-wrapper/decorator'
import Web from 'web-component-wrapper/Web'
import {WebComponentAPI, StaticWebComponent} from 'web-component-wrapper/type'

import {
    Action,
    AnnotatedDomNode,
    AnnotatedModelDomNode,
    Configuration,
    IndicatorFunction,
    Model,
    ModelAnnotation,
    PropertyTypes,
    Response,
    ResponseResult,
    TargetConfiguration
} from './type'
// endregion
// region components
/**
 * Form handler which accepts a various number of content projected dom nodes
 * to interact with them following a given specification object.
 * @property static:baseScopeNames - List of generic scope names available in
 * all evaluations environments.
 * @property static:defaultConfiguration - Holds default extendable
 * configuration object.
 * @property static:specificationToPropertyMapping - Mapping model
 * specification keys to their corresponding input field property name (if not
 * equal).
 *
 * @property clearButtons - Reference to form clear button nodes.
 * @property inputs - Mapping from field names to their corresponding input
 * dom node.
 * @property resetButtons - Reference to form reset button nodes.
 * @property spinner - Reference to a spinner dom node.
 * @property statusMessageBoxes - Reference to dom node which holds status
 * messages.
 * @property submitButtons - Reference to submit button nodes.
 * @property truncateButtons - Reference to form truncate buttons.

 * @property dependencyMapping - Mapping from each field to their dependent one.

 * @property groups - Mapping from group dom nodes to containing field names
 * and conditional show if expression.

 * @property determinedTargetURL - Last determined target url.
 * @property initialData - Initialed form input values.
 * @property initialResponse - Initialisation server response.
 * @property latestResponse - Last seen server response.
 * @property message - Current error message about unsatisfied given
 * specification.
 * @property response - Current parsed response from send form data.

 * @property inputEventBindings - Holds a mapping from nodes with registered
 * event handlers mapped to their de-registration function.
 * @property models - Mapping from field name to corresponding configuration.
 * @property modelNames - Specified transformer environment variable names.

 * @property invalid - Indicates whether this form has invalid input.
 * @property onceSubmitted - Indicates whether this form was submitted once
 * already.
 * @property pending - Indicates whether a request is currently running.
 * @property submitted - Indicates whether this form state was submitted
 * already.
 * @property valid - Indicates whether this form has valid input.

 * @property reCaptchaFallbackInput - Reference to render re-captcha fallback
 * into.
 * @property reCaptchaFallbackRendered - Indicates whether a fallback
 * re-captcha inputs was already rendered.
 * @property reCaptchaPromise - Reference to re-captcha initialisation promise.
 * @property reCaptchaPromiseResolver - Reference to re-captcha initialisation
 * @property reCaptchaToken - Last challenge result token.
 * promise resolver.

 * @property resolvedConfiguration - Holds given configuration object.
 * @property urlConfiguration - URL given configurations object.
 *
 * @property tools - Holds tools instance for saving instance specific locks.
 */
export class AgileForm<TElement = HTMLElement> extends Web<TElement> {
    // region properties
    static baseScopeNames:Array<string> = [
        'determineStateURL',
        'determinedTargetURL',
        'getData',
        'initialResponse',
        'invalid',
        'latestResponse',
        'pending',
        'response',
        'stateMessage',
        'submitted',
        'tools',
        'valid'
    ]
    static content:string = '<form novalidate><slot></slot></form>'
    static defaultConfiguration:Configuration = {
        actions: {},
        animation: true,
        constraints: [],
        data: null,
        debug: false,
        evaluations: [],
        expressions: [],
        initializeTarget: {
            options: {method: 'GET'},
            url: ''
        },
        model: {},
        name: 'aForm',
        offsetInPixel: 85,
        reCaptcha: {
            key: {
                v2: '',
                v3: ''
            },
            action: {
                action: 'aForm'
            },
            secret: '',
            skip: false,
            token: ''
        },
        responseDataWrapperSelector: {
            optional: true,
            path: 'data'
        },
        securityResponsePrefix: ")]}',",
        selector: {
            clearButtons: 'button[clear]',
            groups: '.agile-form__group',
            // TODO do not allow nested elements, as long as not supported
            // prefer high-level inputs over native "<input />"
            // TODO support buttons (with two states).
            inputs: 'button[name], generic-input, requireable-checkbox, slider-input',
            reCaptchaFallbackInput: '.agile-form__re-captcha-fallback',
            resetButtons: 'button[reset], [type=reset]',
            spinner: 'circular-spinner',
            statusMessageBoxes: '.agile-form__status-message',
            submitButtons: 'button[submit], [type=submit]',
            truncateButtons: 'button[truncate]'
        },
        showAll: false,
        tag: {
            secret: '',
            values: []
        },
        target: {
            options: {
                body: {
                    __evaluate__: 'targetData'
                },
                cache: 'no-store',
                /*
                    NOTE: Send user credentials (cookies, basic http
                    authentication, etc..), even for cross-origin calls.
                */
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'G-Recaptcha-Response': {
                        __evaluate__: 'reCaptcha.token'
                    },
                    'G-Recaptcha-Skip': {
                        __evaluate__: 'reCaptcha.skip'
                    },
                    'G-Recaptcha-Skip-Secret': {
                        __evaluate__: 'reCaptcha.secret '
                    }
                } as unknown as Mapping,
                // NOTE: Not yet supported by chrome: keepalive: keepalive
                method: 'PUT',
                mode: 'cors',
                redirect: 'follow'
            },
            url: ''
        },
        targetData: null,
        urlModelMask: {
            exclude: false,
            include: {
                model: false,

                reCaptcha: {
                    secret: true,
                    skip: true
                },

                tag: true,
                tags: true
            }
        },
        version: 1
    }
    static specificationToPropertyMapping:Mapping<{
        invert?:boolean
        name:string
    }> = {
        nullable: {
            invert: true,
            name: 'required'
        }
    }
    static _name:string = 'AgileForm'

    clearButtons:Array<AnnotatedDomNode> = []
    inputs:Mapping<AnnotatedModelDomNode> = {}
    resetButtons:Array<AnnotatedDomNode> = []
    spinner:Array<AnnotatedDomNode> = []
    statusMessageBoxes:Array<AnnotatedDomNode> = []
    submitButtons:Array<AnnotatedDomNode> = []
    truncateButtons:Array<AnnotatedDomNode> = []

    dependencyMapping:Mapping<Array<string>> = {}

    groups:Map<AnnotatedDomNode, {
        childNames:Array<string>
        showIf?:IndicatorFunction
    }> = new Map()

    determinedTargetURL:null|string = null
    initialData:PlainObject = {}
    initialResponse:any = null
    latestResponse:any = null
    message:string = ''
    response:any = null

    inputEventBindings:Mapping<Function> = {}
    models:Mapping<Model> = {}
    modelNames:Array<string> = []

    invalid:boolean|null = null
    onceSubmitted:boolean = false
    pending:boolean = true
    submitted:boolean = false
    valid:boolean|null = null

    reCaptchaFallbackInput:AnnotatedDomNode|null = null
    reCaptchaFallbackRendered:boolean = false
    /*
        NOTE: Will be finally initialized when promise is created so do not
        change order here.
    */
    reCaptchaPromiseResolver:(result:null|string) => void =
        (result:null|string) => {}
    reCaptchaPromise:Promise<null|string> = new Promise(
        (resolve:(result:null|string) => void):void => {
            this.reCaptchaPromiseResolver = resolve
        }
    )
    reCaptchaToken:null|string = null

    @property({type: object})
    baseConfiguration:Partial<Configuration>|undefined
    @property({type: object})
    configuration:Partial<Configuration>|undefined
    @property({type: object})
    dynamicConfiguration:Partial<Configuration>|undefined
    resolvedConfiguration:Configuration = {} as Configuration
    urlConfiguration:null|PlainObject = null

    readonly self:typeof AgileForm = AgileForm

    readonly tools:Tools = new Tools()
    // endregion
    // region live cycle hooks
    /**
     * Defines dynamic getter and setter interface and resolves configuration
     * object.
     */
    constructor() {
        super()
        /*
            Babels property declaration transformation overwrites defined
            properties at the end of an implicit constructor. So we have to
            redefined them as long as we want to declare expected component
            interface properties to enable static type checks.
        */
        this.defineGetterAndSetterInterface()
        this.resolveConfiguration()
    }
    /**
     * Parses given configuration object and delegates to forward them to
     * nested input nodes.
     * @param name - Attribute name which was updates.
     * @param oldValue - Old attribute value.
     * @param newValue - New updated value.
     * @returns Nothing.
     */
    attributeChangedCallback(
        name:string, oldValue:string, newValue:string
    ):void {
        super.attributeChangedCallback(name, oldValue, newValue)

        this.resolveConfiguration()
    }
    /**
     * Registers new re-captcha token.
     * @returns Nothing.
     */
    connectedCallback():void {
        super.connectedCallback()

        this.updateReCaptchaToken()
    }
    /**
     * De-registers all needed event listener.
     * @returns Nothing.
     */
    disconnectedCallback():void {
        super.disconnectedCallback()

        window.removeEventListener('keydown', this.onKeyDown)
        for (const domNode of this.clearButtons)
            domNode.removeEventListener('click', this.onClear, false)
        for (const domNode of this.resetButtons)
            domNode.removeEventListener('click', this.onReset, false)
        for (const domNode of this.submitButtons)
            domNode.removeEventListener('click', this.onSubmit, false)
        for (const domNode of this.truncateButtons)
            domNode.removeEventListener('click', this.onTruncate, false)

        for (const name in this.inputEventBindings)
            if (this.inputEventBindings.hasOwnProperty(name))
                this.inputEventBindings[name]()
    }
    /**
     * Triggered when content projected and nested dom nodes are ready to be
     * traversed. Selects all needed dom nodes.
     * @param reason - Description why rendering is necessary.
     * @returns A promise resolving to nothing.
     */
    async render(reason:string = 'unknown'):Promise<void> {
        if (!this.dispatchEvent(new CustomEvent('render', {detail: {reason}})))
            return

        /*
            NOTE: We need a digest loop to allow the components to extend given
            model object with their defaults.
        */
        await this.digest()
        await this.configureContentProjectedInputs()

        this.reCaptchaFallbackInput = this.root.querySelector(
            this.resolvedConfiguration.selector.reCaptchaFallbackInput
        )
        if (this.reCaptchaFallbackInput) {
            if (this.resolvedConfiguration.showAll)
                this.activate(this.reCaptchaFallbackInput)
            else
                this.deactivate(this.reCaptchaFallbackInput)

            if (this.resolvedConfiguration.debug)
                this.updateReCaptchaFallbackToken()
        }

        this.spinner = Array.from(this.root.querySelectorAll(
            this.resolvedConfiguration.selector.spinner
        ))

        this.statusMessageBoxes = Array.from(this.root.querySelectorAll(
            this.resolvedConfiguration.selector.statusMessageBoxes
        ))

        this.clearButtons = Array.from(this.root.querySelectorAll(
            this.resolvedConfiguration.selector.clearButtons
        ))
        this.resetButtons = Array.from(this.root.querySelectorAll(
            this.resolvedConfiguration.selector.resetButtons
        ))
        this.submitButtons = Array.from(this.root.querySelectorAll(
            this.resolvedConfiguration.selector.submitButtons
        ))
        this.truncateButtons = Array.from(this.root.querySelectorAll(
            this.resolvedConfiguration.selector.truncateButtons
        ))

        window.addEventListener('keydown', this.onKeyDown)
        for (const domNode of this.clearButtons)
            domNode.addEventListener('click', this.onClear, false)
        for (const domNode of this.resetButtons)
            domNode.addEventListener('click', this.onReset, false)
        for (const domNode of this.submitButtons)
            domNode.addEventListener('click', this.onSubmit, false)
        for (const domNode of this.truncateButtons)
            domNode.addEventListener('click', this.onTruncate, false)

        /*
            Show potentially grabbed messages coming from the initialisation
            phase.
        */
        this.updateMessageBox()

        await this.stopBackgroundProcess(
            new CustomEvent('rendered', {detail: {reason}})
        )
    }
    // endregion
    // region handle visibility states
    /**
     * Fades given dom node to given opacity.
     * @param domNode - Node to fade.
     * @param opacity - Opacity value between 0 and 1.
     * @param durationInMilliseconds - Duration of animation.
     * @returns Nothing.
     */
    fade(
        domNode:AnnotatedDomNode,
        opacity:number = 1,
        durationInMilliseconds:number = 100
    ):void {
        if (domNode.clearFading)
            domNode.clearFading()
        if (parseFloat(domNode.style.opacity) === opacity)
            return
        if (opacity === 0) {
            if (!this.resolvedConfiguration.animation) {
                domNode.style.display = 'none'
                return
            }
            const oldPosition:string = domNode.style.position
            /*
                Make this element absolute at current position to potentially
                fade other elements in at overlapping position.
            */
            domNode.style.position = 'absolute'
            const timer = setInterval(
                ():void => {
                    if (opacity <= 0.1) {
                        if (domNode.clearFading)
                            domNode.clearFading()
                        return
                    }
                    domNode.style.opacity = `${opacity}`
                    opacity -= opacity * 0.1
                },
                durationInMilliseconds * 0.1
            )
            domNode.clearFading = ():void => {
                clearInterval(timer)
                domNode.style.opacity = '0'
                domNode.style.display = 'none'
                domNode.style.position = oldPosition
                delete domNode.clearFading
            }
        } else {
            domNode.style.display = 'block'
            if (!this.resolvedConfiguration.animation) {
                domNode.style.opacity = '1'
                return
            }
            opacity = 0.1
            const timer = setInterval(
                ():void => {
                    if (opacity >= 1) {
                        if (domNode.clearFading)
                            domNode.clearFading()
                        return
                    }
                    domNode.style.opacity = `${opacity}`
                    opacity += opacity * 0.1
                },
                durationInMilliseconds * 0.1
            )
            domNode.clearFading = ():void => {
                clearInterval(timer)
                domNode.style.opacity = '1'
                delete domNode.clearFading
            }
        }
    }
    /**
     * Adds given dom nodes visual representation.
     * @param domNode - Node to activate.
     * @returns Nothing.
     */
    activate(domNode:AnnotatedDomNode):void {
        this.fade(domNode)
    }
    /**
     * Removes given dom nodes visual representation.
     * @param domNode - Node to deactivate.
     * @returns Nothing.
     */
    deactivate(domNode:AnnotatedDomNode):void {
        this.fade(domNode, 0)
    }
    /**
     * Shows the spinner.
     * @returns Nothing.
     */
    showSpinner():void {
        if (this.spinner.length) {
            for (const domNode of this.spinner)
                this.activate(domNode)
            this.scrollAndFocus(this.spinner[0])
        }
    }
    /**
     * Hides the spinner.
     * @returns Nothing.
     */
    hideSpinner():void {
        for (const domNode of this.spinner)
            this.deactivate(domNode)
    }
    /**
     * Updates given field (by name) visibility state.
     * @param name - Field name to update.
     * @returns A promise resolving to a boolean value indicating whether a
     * visibility change has been happen.
     */
    async updateInputVisibility(name:string):Promise<boolean> {
        const model:Model = this.models[name]
        const oldState:boolean|undefined = model.shown
        this.inputs[name].shown =
        model.shown =
            !model.showIf || model.showIf!(false)
        if (model.shown !== oldState) {
            if (this.resolvedConfiguration.debug)
                if (Boolean(oldState) === oldState)
                    console.debug(
                        `Update input "${name}" visibility state from ` +
                        `"${oldState ? 'show' : 'hide'}" to "` +
                        `${model.shown ? 'show' : 'hide'}".`
                    )
                else
                    console.debug(
                        `Initialize input "${name}" visibility state to "` +
                        `${model.shown ? 'show' : 'hide'}".`
                    )
            if (model.shown || this.resolvedConfiguration.showAll)
                this.activate(this.inputs[name])
            else {
                if (model.valuePersistence === 'resetOnHide')
                    await this.resetInput(name)
                this.deactivate(this.inputs[name])
            }
            return true
        }
        /*
        console.debug(
            `Input "${name}" stays in visibility state ` +
            `"${oldState ? 'show' : 'hide'}".`
        )
        */
        return false
    }
    /**
     * Updates all group visibility states.
     * @returns Nothing.
     */
    updateAllGroups():void {
        this.groups.forEach((
            specification:{
                childNames:Array<string>
                showIf?:IndicatorFunction
            },
            domNode:AnnotatedDomNode
        ):void => {
            const name:string = domNode.getAttribute('name') ?? 'unknown'
            const oldState:boolean|null = domNode.shown

            domNode.shown = (
                specification.showIf &&
                specification.showIf() ||
                !specification.showIf &&
                (
                    specification.childNames.some((name:string):boolean =>
                        Boolean(
                            !this.models.hasOwnProperty(name) ||
                            this.models[name].shown
                        )
                    ) ||
                    specification.childNames.length === 0
                )
            )
            if (domNode.shown === oldState) {
                /*
                console.debug(
                    `Group "${domNode.getAttribute('name')}" stays in ` +
                    `visibility state "${oldState ? 'show' : 'hide'}".`
                )
                */
                if (domNode.shown)
                    this.updateGroupContent(domNode)
                return
            }

            if (this.resolvedConfiguration.debug)
                if (Boolean(oldState) === oldState)
                    console.debug(
                        `Update group "${domNode.getAttribute('name')}" ` +
                        'visibility state from "' +
                        `${oldState ? 'show' : 'hide'}" to "` +
                        `${domNode.shown ? 'show' : 'hide'}".`
                    )
                else
                    console.debug(
                        `Initialize group "${domNode.getAttribute('name')}" ` +
                        `visibility state to "` +
                        `${domNode.shown ? 'show' : 'hide'}".`
                    )

            if (domNode.shown || this.resolvedConfiguration.showAll) {
                domNode.style.opacity = '0'
                domNode.style.display = 'block'
                if (domNode.shown)
                    this.updateGroupContent(domNode)
                this.fade(domNode)
            } else
                this.fade(domNode, 0)
        })
    }
    /**
     * Evaluate dynamic text content.
     * @param domNode - Dom node to render its content.
     * @returns Nothing.
     */
    updateGroupContent(domNode:AnnotatedDomNode):void {
        const scope:Mapping<any> = {}
        const keys:Array<string> = this.self.baseScopeNames.concat(
            this.resolvedConfiguration.expressions.map(
                (expression:Array<string>):string => expression[0]
            ),
            this.modelNames
        )
        const values:Array<any> = [
            this.determineStateURL,
            this.determinedTargetURL,
            this.getData,
            this.initialResponse,
            this.invalid,
            this.latestResponse,
            this.pending,
            this.response,
            this.message,
            this.onceSubmitted,
            Tools,
            this.valid,
            ...this.evaluateExpressions(),
            ...this.modelNames.map((name:string):any =>
                this.models[name]
            )
        ]
        for (let index = 0; index < keys.length; index += 1)
            scope[keys[index]] = values[index]

        this.evaluateDomNodeTemplate<AnnotatedDomNode>(
            domNode,
            scope,
            {
                applyBindings: false,
                filter: (domNode:HTMLElement):boolean =>
                    /*
                        NOTE: Avoid updating nested nodes which are grouped by
                        their own.
                    */
                    !(
                        domNode.matches &&
                        domNode.matches(
                            this.resolvedConfiguration.selector.groups
                        )
                    )
            }
        )
    }
    /**
     * Updates current error message box state.
     * @returns Nothing.
     */
    updateMessageBox(message?:null|string):void {
        if (typeof message === 'string')
            this.message = message
        else if (message === null)
            this.message = ''
        for (const domNode of this.statusMessageBoxes)
            if (this.message) {
                domNode.style.display = 'block'
                domNode.textContent = this.message
            } else
                domNode.style.display = 'none'
    }
    // endregion
    // region helper
    // / region configuration
    /**
     * Merges configuration sources into final object.
     * @returns Nothing.
     */
    resolveConfiguration():void {
        this.resolvedConfiguration =
            Tools.copy(this.self.defaultConfiguration) as Configuration

        for (const configuration of [
            this.baseConfiguration || {},
            this.configuration || {},
            this.dynamicConfiguration || {}
        ])
            Tools.extend(true, this.resolvedConfiguration, configuration)

        this.extendConfigurationByGivenURLParameter()

        // NOTE: We migrate alternate tag option formats.
        this.resolvedConfiguration.tag.values =
            ([] as Array<string>).concat(this.resolvedConfiguration.tag.values)
        if (this.resolvedConfiguration.hasOwnProperty('tags'))
            this.resolvedConfiguration.tag.values =
                this.resolvedConfiguration.tag.values.concat((
                    this.resolvedConfiguration as
                        unknown as {tags:Array<string>}
                ).tags)

        this.resolvedConfiguration.initializeTarget = Tools.extend(
            true,
            Tools.copy(this.resolvedConfiguration.target),
            this.resolvedConfiguration.initializeTarget
        )

        if (this.resolvedConfiguration.debug)
            console.debug(
                'Got configuration:',
                Tools.represent(this.resolvedConfiguration)
            )
    }
    /**
     * Extends current configuration object by given url parameter.
     * @param name - URL parameter name to interpret.
     * @returns Nothing.
     */
    extendConfigurationByGivenURLParameter(name?:string):void {
        if (!name)
            name = this.resolvedConfiguration.name

        const parameter:Array<string>|null|string =
            Tools.stringGetURLParameter(name)
        if (typeof parameter === 'string') {
            const evaluated:EvaluationResult =
                Tools.stringEvaluate(decodeURI(parameter))
            if (evaluated.error) {
                console.warn(
                    'Error occurred during processing given url parameter "' +
                    `${name}": ${evaluated.error}`
                )
                return
            }
            if (
                evaluated.result !== null &&
                typeof evaluated.result === 'object'
            ) {
                this.urlConfiguration = Tools.maskObject(
                    evaluated.result, this.resolvedConfiguration.urlModelMask
                ) as PlainObject
                Tools.extend(
                    true, this.resolvedConfiguration, this.urlConfiguration
                )
            }
        }
    }
    // / endregion
    // / region apply configurations to components
    /**
     * Forwards all input specifications to their corresponding input node.
     * Observes fields for changes to apply specified inter-constraints between
     * them.
     * @returns Nothing.
     */
    async configureContentProjectedInputs():Promise<void> {
        const lockName:string = 'configureContentProjectedInputs'
        await this.tools.acquireLock(lockName)

        const missingInputs:Mapping<Model> =
            await this.connectSpecificationWithDomNodes()

        // Configure input components to hide validation states first.
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name))
                this.inputs[name].showInitialValidationState = false
        await this.digest()

        this.preCompileConfigurationExpressions()
        this.setGroupSpecificConfigurations()

        if (Object.keys(missingInputs).length)
            /*
                NOTE: Message node may not be registered yet so do not render
                message directly.
            */
            this.message = (
                'Missing input for expected model name "' +
                `${Object.keys(missingInputs).join('", "')}".`
            )

        this.createDependencyMapping()
        this.applyInputBindings()

        await this.tools.releaseLock(lockName)
    }
    /**
     * Determine all environment variables to ran expressions again. We have to
     * do this a second time to include dynamically added inputs in prototyping
     * mode.
     * @returns Nothing.
     */
    determineModelNames():void {
        this.modelNames = Object.keys(this.models)
            .filter((name:string):boolean => !name.includes('.'))
            .map((name:string):string =>
                Tools.stringConvertToValidVariableName(name)
            )
    }
    /**
     * Finds all fields and connects them with their corresponding model
     * specification.
     * @returns An object mapping with missing but specified fields.
     */
    async connectSpecificationWithDomNodes():Promise<Mapping<Model>> {
        const inputs:Array<AnnotatedModelDomNode> =
            Array.from(this.root.querySelectorAll(
                this.resolvedConfiguration.selector.inputs
            ))
        // If no input is specified simply consider all provided inputs.
        const dummyMode:boolean = Object.keys(this.models).length === 0
        // Show all inputs in dummy mode.
        if (dummyMode)
            for (const domNode of inputs)
                this.activate(domNode)
        this.models = {...this.resolvedConfiguration.model}
        const missingInputs:Mapping<Model> = {...this.models}
        this.determineModelNames()
        this.inputs = {}
        this.initialData = {}
        let index:number = 0
        /*
            Match all found inputs against existing specified fields or load
            not specified input into the specification (model configuration).
        */
        for (const domNode of inputs) {
            const name:null|string = domNode.getAttribute('name')
            if (name) {
                if (this.resolvedConfiguration.model.hasOwnProperty(name)) {
                    this.models[name] = this.resolvedConfiguration.model[name]
                    delete missingInputs[name]
                    if (
                        this.resolvedConfiguration.debug &&
                        this.models[name].showIfExpression
                    )
                        domNode.setAttribute(
                            'title',
                            this.models[name].showIfExpression as string
                        )
                } else if (name.includes('.'))
                    // Found input is a computable field.
                    this.models[name] = {
                        /*
                            NOTE: Will depend on all other available model
                            names.
                        */
                        dependsOn: null,
                        dynamicExtendExpressions: {value: name},
                        showIfExpression: name
                    }
                else if (dummyMode)
                    // Nothing is specified: Prototyping mode.
                    this.models[name] = {
                        /*
                            NOTE: Will depend on all other available model
                            names.
                        */
                        dependsOn: null,
                        name,
                        ...domNode.model
                    }
                else {
                    /*
                        Specification exists but corresponding input couldn't
                        be found.
                    */
                    this.message =
                        `Given input "${name}" not found in current ` +
                        'configuration. Expected names are: "' +
                        `${this.modelNames.join('", "')}".`
                    continue
                }
                // Do not control "state" from the outside.
                delete this.models[name].state
                if (this.models[name].hasOwnProperty('value')) {
                    // Control value via "value" property in dom node.
                    domNode.initialValue = this.models[name].value
                    delete this.models[name].value
                }
                let model:Model = Tools.copy(this.models[name])
                if (domNode.hasAttribute('model')) {
                    const result:EvaluationResult = Tools.stringEvaluate(
                        domNode.getAttribute('model') as string
                    )
                    if (result.error)
                        console.warn(
                            'Failed to evaluate field model configuration "' +
                            `${domNode.getAttribute('model')} for field "` +
                            `${name}".`
                        )
                    model = Tools.extend(true, result.result, model)
                }
                domNode.model = model

                if ([model.mutable, model.writable].includes(false))
                    domNode.disabled = true

                this.models[name].domNode = domNode
                await this.digest()
                Object.defineProperty(
                    this.models[name],
                    'value',
                    {
                        get: ():any => domNode.value,
                        set: (value:any):void => {
                            domNode.value = value
                        }
                    }
                )
                /*
                    NOTE: We have to determine initial value since the
                    component is already initialized by itself.
                */
                if (
                    (
                        [null, undefined].includes(domNode.value) ||
                        domNode.pristine
                    ) &&
                    !(
                        [null, undefined].includes(
                            domNode.initialValue as null
                        ) &&
                        [null, undefined].includes(
                            model.default as unknown as null
                        ) &&
                        [null, undefined].includes(model.value)
                    )
                )
                    domNode.value =
                        model.value ??
                        domNode.initialValue ??
                        model.default
                await this.digest()
                this.inputs[name] = domNode
                this.initialData[name] = domNode.value
            } else
                this.message =
                    `Missing attribute "name" for ${index}. given input.`
            index += 1
        }
        this.determineModelNames()
        /*
            Set all environment variables as dependencies of no explicit
            dependencies are listed.
        */
        for (const name in this.models)
            if (
                this.models[name].hasOwnProperty('dependsOn') &&
                this.models[name].dependsOn === null
            )
                this.models[name].dependsOn = this.modelNames
        return missingInputs
    }
    /**
     * Whenever a component is re-configured a digest is needed to ensure that
     * its internal state has been reflected.
     * @returns A promise resolving when digest hast been finished.
    */
    digest():ReturnType<typeof Tools.timeout> {
         return Tools.timeout()
    }
    /**
     * Finds all groups and connects them with their corresponding compiled
     * show if indicator functions. Additionally some description will be
     * supplied.
     * @returns Nothing.
     */
    setGroupSpecificConfigurations():void {
        this.groups = new Map()
        const groups:Array<AnnotatedDomNode> = Array.from(
            this.root.querySelectorAll(
                this.resolvedConfiguration.selector.groups
            )
        )

        const originalScopeNames:Array<string> = this.self.baseScopeNames.concat(
            this.resolvedConfiguration.expressions.map(
                (expression:Array<string>):string => expression[0]
            ),
            this.modelNames
        )

        for (const domNode of groups) {
            const specification:{
                childNames:Array<string>
                showIf?:IndicatorFunction
            } = {
                childNames: (Array.from(domNode.querySelectorAll(
                    this.resolvedConfiguration.selector.inputs
                )) as Array<AnnotatedModelDomNode>)
                    .filter((domNode:AnnotatedModelDomNode):boolean =>
                        typeof domNode.getAttribute('name') === 'string' ||
                        typeof domNode.getAttribute('data-name') === 'string'
                    )
                    .map((domNode:AnnotatedModelDomNode):string => (
                        domNode.getAttribute('name') ||
                        domNode.getAttribute('data-name')
                    ) as string)
            }
            if (
                domNode.getAttribute('show-if') ||
                domNode.getAttribute('data-show-if')
            ) {
                const code:string = ((
                    domNode.getAttribute('show-if') ||
                    domNode.getAttribute('data-show-if')
                ) as string)
                    .replace(/(#039;)|(&amp;)/g, '&')
                    .replace(/<br\/>/g, '')
                let name:string = 'UNKNOWN'
                if (typeof domNode.getAttribute('data-name') === 'string')
                    name = domNode.getAttribute('data-name') as string
                if (typeof domNode.getAttribute('name') === 'string')
                    name = domNode.getAttribute('name') as string

                const {error, scopeNames, templateFunction} =
                    Tools.stringCompile(code, originalScopeNames)

                if (error)
                    console.error(
                        'Failed to compile "show-if" group expression ' +
                        `attribute "${name}": ${error}`
                    )
                else
                    specification.showIf = ():boolean => {
                        try {
                            return Boolean(templateFunction(
                                this.determineStateURL,
                                this.determinedTargetURL,
                                this.getData,
                                this.initialResponse,
                                this.invalid,
                                this.latestResponse,
                                this.pending,
                                this.response,
                                this.message,
                                this.onceSubmitted,
                                Tools,
                                this.valid,
                                ...this.evaluateExpressions(),
                                ...this.modelNames.map((name:string):any =>
                                    this.models[name]
                                )
                            ))
                        } catch (error) {
                            console.error(
                                `Failed to evaluate group "${name}" code "` +
                                `${code}" with bound names "` +
                                `${scopeNames.join('", "')}": "` +
                                `${Tools.represent(error)}".`
                            )
                        }
                        return false
                    }
            }
            this.groups.set(domNode, specification)
        }
    }
    /**
     * Generates a mapping from each field name to their corresponding
     * dependent field names.
     * @returns Nothing.
     */
    createDependencyMapping():void {
        this.dependencyMapping = {}
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name)) {
                if (!this.dependencyMapping.hasOwnProperty(name))
                    this.dependencyMapping[name] = []

                if (this.models[name].dependsOn)
                    for (
                        const dependentName of ([] as Array<string>).concat(
                            this.models[name].dependsOn as Array<string>
                        )
                    )
                        if (this.dependencyMapping.hasOwnProperty(
                            dependentName
                        )) {
                            if (!this.dependencyMapping[
                                dependentName
                            ].includes(name))
                                this.dependencyMapping[dependentName]
                                    .push(name)
                        } else
                            this.dependencyMapping[dependentName] = [name]
            }
    }
    // / endregion
    // / region expression compiler
    /**
     * Pre-compiles specified given expression for given field.
     * @param type - Indicates which expression type should be compiled.
     * @param name - Field name to pre-compile their expression.
     * @returns Nothing.
     */
    preCompileExpressions(name:string, type:string = 'transformer'):void {
        const typeName:'transformerExpression' = `${type}Expression` as
            'transformerExpression'
        if (this.models[name][typeName]) {
            const code:string = this.models[name][typeName] as string
            const {error, scopeNames, templateFunction} = Tools.stringCompile(
                code,
                this.self.baseScopeNames.concat(
                    'self',
                    'value',
                    this.resolvedConfiguration.expressions.map(
                        (expression:Array<string>):string => expression[0]
                    ),
                    this.models[name].dependsOn || []
                )
            )

            if (error)
                console.error(
                    `Failed to compile "${typeName}" "${name}": ${error}`
                )

            this.models[name][type as 'transformer'] = (value:any):any => {
                try {
                    return templateFunction(
                        this.determineStateURL,
                        this.determinedTargetURL,
                        this.getData,
                        this.initialResponse,
                        this.invalid,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.valid,
                        this.models[name],
                        value,
                        ...this.evaluateExpressions(),
                        ...(this.models[name].dependsOn || [])
                            .map((name:string):any => this.models[name])
                    )
                } catch (error) {
                    console.warn(
                        `Failed running "${typeName}" "${code}" for field ` +
                        `field "${name}" with bound names "` +
                        `${scopeNames.join('", "')}": "` +
                        `${Tools.represent(error)}".`
                    )
                }

                return value
            }
        }
    }
    /**
     * Pre-compiles specified given dynamic extend expressions for given field.
     * @param name - Field name to pre-compile their expression.
     * @returns Nothing.
     */
    preCompileDynamicExtendStructure(name:string):void {
        if (!this.models[name].dynamicExtendExpressions)
            return

        this.models[name].dynamicExtend = {}
        for (const subName in this.models[name].dynamicExtendExpressions)
            if (
                this.models[name].dynamicExtendExpressions!
                    .hasOwnProperty(subName)
            ) {
                const code:((event:Event, scope:any) => any)|string =
                    this.models[name].dynamicExtendExpressions![subName]

                let originalScopeNames:Array<string> =
                    this.self.baseScopeNames.concat(
                        'event',
                        'eventName',
                        'scope',
                        'selfName',
                        'self',
                        this.resolvedConfiguration.expressions.map(
                            (expression:Array<string>):string => expression[0]
                        ),
                        this.models[name].dependsOn || []
                    )
                let scopeNames:Array<string>
                let templateFunction:TemplateFunction

                if (typeof code === 'string') {
                    const result:CompilationResult =
                        Tools.stringCompile(code, originalScopeNames)
                    scopeNames = result.scopeNames
                    templateFunction = result.templateFunction
                    if (result.error)
                        console.error(
                            `Failed to compile "dynamicExtendExpression" for` +
                            ` property "${subName}" in field "${name}":`,
                            result.error
                        )
                } else {
                    scopeNames = originalScopeNames.map((name:string):string =>
                        Tools.stringConvertToValidVariableName(name)
                    )
                    templateFunction = code
                }

                this.models[name].dynamicExtend![subName] = (
                    event:Event
                ):any => {
                    const scope:Mapping<any> = {}
                    const context:Array<any> = [
                        this.determineStateURL,
                        this.determinedTargetURL,
                        this.getData,
                        this.initialResponse,
                        this.invalid,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.valid,
                        event,
                        this.determineEventName(event),
                        scope,
                        name,
                        this.models[name],
                        ...this.evaluateExpressions(),
                        ...(this.models[name].dependsOn || [])
                            .map((name:string):any => this.models[name])
                    ]
                    let index:number = 0
                    for (const name of scopeNames) {
                        scope[name] = context[index]
                        index += 1
                    }
                    try {
                        return Tools.isFunction(code) ?
                            code(event, scope) :
                            templateFunction!(...context)
                    } catch (error) {
                        console.error(
                            `Failed running "dynamicExtendExpression" "` +
                            `${code}" for property "${subName}" in field "` +
                            `${name}" with bound names "` +
                            `${scopeNames.join('", "')}": "` +
                            `${Tools.represent(error)}".`
                        )
                    }
                }
            }
    }
    /**
     * Pre-compiles all specified action source expressions.
     * @returns Nothing.
     */
    preCompileActionSources():void {
        const originalScopeNames:Array<string> = this.self.baseScopeNames
            .concat(
                this.resolvedConfiguration.expressions.map(
                    (expression:Array<string>):string => expression[0]
                ),
                this.modelNames
            )

        for (const name in this.resolvedConfiguration.actions)
            if (this.resolvedConfiguration.actions.hasOwnProperty(name)) {
                const code:string =
                    this.resolvedConfiguration.actions[name].code
                if (code.trim() === 'fallback')
                    continue

                const {error, scopeNames, templateFunction} =
                    Tools.stringCompile(code, originalScopeNames)
                if (error)
                    console.error(
                        `Failed to compile action source expression "${name}` +
                        `": ${error}`
                    )

                this.resolvedConfiguration.actions[name].indicator = (
                ):any => {
                    try {
                        return templateFunction(
                            this.determineStateURL,
                            this.determinedTargetURL,
                            this.getData,
                            this.initialResponse,
                            this.invalid,
                            this.latestResponse,
                            this.pending,
                            this.response,
                            this.message,
                            this.onceSubmitted,
                            Tools,
                            this.valid,
                            ...this.evaluateExpressions(),
                            ...this.modelNames.map((name:string):any =>
                                this.models[name]
                            ),
                        )
                    } catch (error) {
                        console.error(
                            `Failed running action source "${name}" ` +
                            `expression "${code}" with bound names "` +
                            `${scopeNames.join('", "')}": "` +
                            `${Tools.represent(error)}".`
                        )
                    }
                }
            }
    }
    /**
     * Pre-compiles all specified generic expressions.
     * @returns Nothing.
     */
    preCompileGenericExpressions():void {
        this.resolvedConfiguration.evaluations = []
        const expressionNames:Array<string> = []
        for (const expression of this.resolvedConfiguration.expressions) {
            const [name, code] = expression

            const {error, scopeNames, templateFunction} = Tools.stringCompile(
                code,
                this.self.baseScopeNames.concat(
                    expressionNames, this.modelNames
                )
            )
            if (error)
                console.error(
                    `Failed to compile generic expression "${name}": ${error}`
                )

            expressionNames.push(name)

            this.resolvedConfiguration.evaluations.push([name, ():any => {
                try {
                    return templateFunction(
                        this.determineStateURL,
                        this.determinedTargetURL,
                        this.getData,
                        this.initialResponse,
                        this.invalid,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.valid,
                        ...this.evaluateExpressions(name),
                        ...this.modelNames.map((name:string):any =>
                            this.models[name]
                        )
                    )
                } catch (error) {
                    console.error(
                        `Failed running generic expression "${name}" ` +
                        `"${code}" with bound names "` +
                        `${scopeNames.join('", "')}": "` +
                        `${Tools.represent(error)}"`
                    )
                }
            }])
        }
    }
    /**
     * Pre-compiles all specified expressions given by the current
     * configuration.
     * @returns Nothing.
     */
    preCompileConfigurationExpressions():void {
        this.preCompileGenericExpressions()
        this.preCompileActionSources()
        for (const name in this.models)
            if (this.models.hasOwnProperty(name)) {
                this.models[name].dependsOn = ([] as Array<string>).concat(
                    this.models[name].dependsOn || []
                )
                for (const type of ['serializer', 'transformer', 'showIf'])
                    this.preCompileExpressions(name, type)
                this.preCompileDynamicExtendStructure(name)
            }
    }
    // / endregion
    // / region initialize/submit/reset actions
    /**
     * Handle initial request to get user specific state depending on remote
     * data.
     * Returns Promise resolving to nothing when initial request has been done.
     */
    async handleInitializeAction():Promise<void> {
        if (this.resolvedConfiguration.actions.hasOwnProperty('initialize')) {
            const event:Event = new Event('initialize')
            if (this.resolvedConfiguration.initializeTarget?.url) {
                const target:TargetConfiguration =
                    Tools.evaluateDynamicData(
                        Tools.copy(this.resolvedConfiguration.initializeTarget),
                        {Tools, ...this.resolvedConfiguration}
                    )
                await this.startBackgroundProcess(event)
                this.initialResponse = this.latestResponse =
                    await this.doRequest(target)
                if (!this.initialResponse) {
                    await this.stopBackgroundProcess(event)
                    return
                }
            }
            const target:null|string = this.resolveAction(
                this.resolvedConfiguration.actions.initialize, 'initialize'
            )
            if (typeof target === 'string')
                location.href = target
            else if (this.pending)
                await this.stopBackgroundProcess(event)
        }
    }
    /**
     * Resolve action.
     * @param action - Action to resolve.
     * @param name - Action description.
     * @returns An action url result or undefined.
     */
    resolveAction(action:Action, name:string):null|string {
        const actionResult:any = action.indicator()
        if (actionResult) {
            console.debug(
                `Action "${name}" matched` +
                (
                    typeof actionResult === 'boolean' ?
                       '' :
                       ` (with result "${actionResult}")`
                ) +
                '.'
            )
            let target:string = action.target
            target = (target && typeof target === 'string') ?
                target.trim() :
                ''
            if (typeof actionResult === 'string')
                if (/^([a-z]+:)?\/\/.+$/.test(actionResult))
                    target = actionResult
                else if (
                    target === '' ||
                    target.endsWith('?') ||
                    target.endsWith('&')
                )
                    target += actionResult
                else
                    target +=
                        `${target.includes('?') ? '&' : '?'}` +
                        actionResult
            return target
        }
        return null
    }
    /**
     * Sets all given input fields to their initial value.
     * @param event - Triggered event object.
     * @returns A promise resolving to nothing.
     */
    onClear = (event:MouseEvent):Promise<void> => {
        return this.onReset(event, true)
    }
    /**
     * Sets all given input fields to their initial value.
     * @param event - Triggered event object.
     * @param useDefault - Indicates to use default value while resetting.
     * @returns A promise resolving to nothing.
     */
    onReset = async (
        event:MouseEvent, useDefault:boolean|null = null
    ):Promise<void> => {
        event.preventDefault()
        event.stopPropagation()
        for (const name in this.inputs)
            try {
                await this.resetInput(name, useDefault)
            } catch (error) {
                console.warn(
                    `Failed to reset input "${name}": ` +
                    Tools.represent(error)
                )
            }
    }
    /**
     * Empties all given input fields.
     * @param event - Triggered event object.
     * @returns A promise resolving to nothing.
     */
    onTruncate = (event:MouseEvent):Promise<void> => {
        return this.onReset(event, null)
    }
    /**
     * Sets given input field their initial value.
     * @param name - Name of the field to clear.
     * @param useDefault - Indicates to use default value while resetting.
     * @returns A promise resolving to a boolean indicating whether provided
     * field name exists.
     */
    async resetInput(
        name:string, useDefault:boolean|null = false
    ):Promise<boolean> {
        if (
            this.inputs.hasOwnProperty(name) &&
            this.models.hasOwnProperty(name)
        ) {
            if (useDefault === false && this.initialData.hasOwnProperty(name))
                this.inputs[name].value = Tools.copy(this.initialData[name])
            else if (useDefault && this.models[name].hasOwnProperty('default'))
                this.inputs[name].value = Tools.copy(this.models[name].default)
            else
                this.inputs[name].value = null
            await this.digest()
            return true
        }
        return false
    }
    // / endregion
    /**
     * Callback triggered when any keyboard events occur.
     * @param event - Keyboard event object.
     * @returns Nothing.
     */
    onKeyDown = (event:KeyboardEvent):void => {
        if (Tools.keyCode.ENTER === event.keyCode)
            this.onSubmit(event)
    }
    /**
     * Calculates current document relative offset of given dom node's
     * position.
     * @param domNode - Target node to calculate from.
     * @returns Calculated values.
     */
    getOffset(domNode:AnnotatedDomNode):Offset {
        const documentNode:HTMLElement = document.documentElement
        const box:ReturnType<HTMLElement['getBoundingClientRect']> =
            domNode.getBoundingClientRect()
        return {
            left: box.left + window.pageXOffset - documentNode.clientLeft,
            top: box.top + window.pageYOffset - documentNode.clientTop
        }
    }
    /**
     * Scrolls to given element and focuses it.
     * @param targetDomNode - Dom node to scroll to.
     * @param smooth - Indicates whether to animate scrolling.
     * @returns a Promise resolving when focusing has finished.
     */
    scrollAndFocus(
        targetDomNode:AnnotatedDomNode, smooth:boolean = true
    ):Promise<void> {
        return new Promise((resolve:ProcedureFunction):void => {
            const offset:Offset = this.getOffset(targetDomNode)
            const newScrollPosition:number = Math.max(
                0, offset.top - this.resolvedConfiguration.offsetInPixel
            )

            const onScroll:ProcedureFunction = ():void => {
                if (
                    window.pageYOffset.toFixed() ===
                        newScrollPosition.toFixed()
                ) {
                    window.removeEventListener('scroll', onScroll)

                    if (typeof targetDomNode.focus === 'function')
                        targetDomNode.focus()

                    resolve()
                }
            }

            window.addEventListener('scroll', onScroll)

            onScroll()

            if (Tools.maximalSupportedInternetExplorerVersion === 0 && smooth)
                window.scrollTo(
                    {
                        behavior: 'smooth',
                        top: newScrollPosition
                    }
                )
            else {
                window.scrollTo(0, newScrollPosition)
                onScroll()
            }
        })
    }
    // / region form submission
    /**
     * Sets all hidden non persistent input fields to their initial value.
     * @returns A promise resolving to nothing.
     */
    async resetAllHiddenNonPersistentInputs():Promise<void> {
        for (const name in this.inputs)
            if (
                this.inputs.hasOwnProperty(name) &&
                this.models.hasOwnProperty(name) &&
                !this.models[name].shown &&
                this.models[name].valuePersistence !== 'persistent'
            )
                await this.resetInput(name)
    }
    /**
     * Retrieves current raw data from given input fields and retrieves invalid
     * fields.
     * @returns An object containing raw data and a list of invalid input
     * fields.
     */
    getData = ():ResponseResult => {
        const data:PlainObject = {}
        const invalidInputNames:Array<string> = []
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name) && !name.includes('.')) {
                const value:any = this.models[name].transformer ?
                    (this.models[name].transformer as (value:any) => any)(
                        this.inputs[name].value
                    ) :
                    this.inputs[name].value
                if (this.models[name].shown && this.inputs[name].invalid)
                    invalidInputNames.push(name)
                if (name && ![null, undefined].includes(value))
                    if (
                        typeof value === 'object' &&
                        this.models[name].hasOwnProperty('dataMapping')
                    ) {
                        const scope:Mapping<any> = {
                            ...value,
                            data,
                            inputs: this.inputs,
                            name,
                            item: value
                        }
                        if (
                            typeof this.models[name].dataMapping === 'string'
                        ) {
                            const evaluated:EvaluationResult =
                                Tools.stringEvaluate(
                                    this.models[name].dataMapping as string,
                                    scope
                                )
                            if (evaluated.error)
                                throw new Error(evaluated.error)
                            data[name] = evaluated.result
                        } else
                            for (const subName in (
                                this.models[name].dataMapping as Mapping
                            ))
                                if ((
                                    this.models[name].dataMapping as Mapping
                                ).hasOwnProperty(subName)) {
                                    const evaluated:EvaluationResult =
                                        Tools.stringEvaluate(
                                            (
                                                this.models[name]
                                                    .dataMapping as Mapping
                                            )[subName],
                                            scope
                                        )
                                    if (evaluated.error)
                                        throw new Error(evaluated.error)
                                    data[subName] = evaluated.result
                                }
                    } else
                        data[name] = value
            }
        return {data, invalidInputNames}
    }
    /**
     * Sets global validation message and scrolls to first invalid field.
     * @param data - Data given by the form.
     * @param invalidInputNames - All currently invalid fields names.
     * @returns Nothing.
     */
    handleInvalidSubmittedInput(
        data:PlainObject, invalidInputNames:Array<string>
    ):void {
        this.updateMessageBox(
            'The following inputs are invalid "' +
            `${invalidInputNames.join('", "')}".`
        )
        const invalidInputs:Array<AnnotatedModelDomNode> = Array.from(
            this.root.querySelectorAll(
                `[name="${invalidInputNames.join('"], [name="')}"]`
            )
        )
        if (invalidInputs.length)
            this.scrollAndFocus(invalidInputs[0])
    }
    /**
     * Handle valid sent data and redirects to corresponding specified target
     * page.
     * @param data - Data given by the form.
     * @param newWindow - Indicates whether action targets should be opened in
     * a new window.
     * @returns Redirection target.
     */
    handleValidSentData(data:PlainObject, newWindow:boolean = false):string {
        this.triggerEvent('submitSuccessful', {reference: {
            request: data,
            response: this.response.data
        }})
        let redirected:boolean = false
        let fallbackTarget:string = ''
        for (const name in this.resolvedConfiguration.actions)
            if (
                this.resolvedConfiguration.actions.hasOwnProperty(name) &&
                name !== 'initialize'
            )
                if (
                    this.resolvedConfiguration.actions[name].code ===
                        'fallback'
                )
                    fallbackTarget =
                        this.resolvedConfiguration.actions[name].target.trim()
                else {
                    const target:null|string = this.resolveAction(
                        this.resolvedConfiguration.actions[name], name
                    )
                    if (typeof target === 'string') {
                        if (newWindow)
                            window.open(target)
                        else {
                            redirected = true
                            location.href = target
                        }
                        return target
                    }
                }
        if (!redirected && fallbackTarget) {
            location.href = fallbackTarget
            return fallbackTarget
        }
        return ''
    }
    /**
     * Handles invalid sent data by setting a message and tracking resulting
     * events.
     * @param response - Servers response.
     * @param data - Data given by the form.
     * @returns Nothing.
     */
    handleUnsuccessfulSentRequest(
        response:Response, rawData:null|PlainObject
    ):void {
        if (response && response.status === 406)
            // NOTE: We have an invalid e-mail address.
            this.triggerEvent(
                'serverEMailAddressInvalid',
                {reference: {request: rawData, response: response.data}}
            )
        else if (response && [401, 403].includes(response.status))
            // NOTE: We have an unauthenticated request.
            this.triggerEvent(
                'serverAuthenticationInvalid',
                {reference: {request: rawData, response: response.data}}
            )
        else if (response && response.status === 420) {
            if (this.updateReCaptchaFallbackToken())
                this.scrollAndFocus(
                    this.reCaptchaFallbackInput as AnnotatedDomNode
                )

            if (this.reCaptchaFallbackRendered)
                // NOTE: We had an unsuccessful re-captcha challenge.
                this.triggerEvent(
                    'reCaptchaFallbackCheckFailed',
                    {reference: {request: rawData, response: response.data}}
                )
            else
                this.triggerEvent(
                    'reCaptchaCheckFailed',
                    {reference: {request: rawData, response: response.data}}
                )
        } else if (response && response.status === 428)
            // NOTE: We have sent an outdated form.
            this.triggerEvent(
                'serverFormOutdated',
                {reference: {request: rawData, response: response.data}}
            )
        else
            // NOTE: Unexpected server error.
            this.triggerEvent(
                'serverUnexpected',
                {reference: {
                    request: rawData,
                    response: response && response.data || null
                }}
            )
    }
    /**
     * Sends a request to provided target configuration and triggers different
     * response dependent events.
     * @param target - Configuration how to request.
     * @param rawData - Initial data to sent, needed for tracking additional
     * informations for triggered request.
     * @returns A promise wrapping a boolean indicating the requests result.
     */
    async doRequest(
        target:TargetConfiguration, rawData:null|PlainObject = null
    ):Promise<null|Response> {
        // region convert headers configuration to header object
        if (
            window.Headers &&
            target.hasOwnProperty('options') &&
            target.options !== null &&
            target.options.hasOwnProperty('headers') &&
            target.options.headers !== null
        ) {
            const givenHeaders:Mapping = target.options.headers as Mapping
            const headers:Headers = new Headers()
            for (const name in target.options.headers)
                if (
                    givenHeaders.hasOwnProperty(name) &&
                    ['boolean', 'number', 'string'].includes(
                        typeof givenHeaders[name as keyof Mapping]
                    ) &&
                    `${givenHeaders[name as keyof Mapping]}`.trim()
                )
                    headers.set(name, givenHeaders[name as keyof Mapping])
            ;(target.options.headers as Headers) = headers
        }
        // endregion
        let result:null|Response = null
        try {
            this.updateReCaptchaToken()
            result = await (fetch as unknown as typeof FetchType)(
                target.url,target.options || {}
            ) as Response
            let responseString:string = await (result as Response).text()
            if (responseString.startsWith(
                this.resolvedConfiguration.securityResponsePrefix
            ))
                responseString = responseString.substring(
                    this.resolvedConfiguration.securityResponsePrefix.length
                )
            ;(result as Response).data = JSON.parse(responseString)
            ;(result as Response).data = Tools.getSubstructure(
                (result as Response).data,
                this.resolvedConfiguration.responseDataWrapperSelector.path,
                this.resolvedConfiguration.responseDataWrapperSelector.optional
            )
        } catch (error) {
            console.warn(
                `Given response could not be interpret as json "` +
                `${Tools.represent(error)}".`
            )
        }
        if (result) {
            if (result.ok && result.data) {
                if (
                    result.data.result &&
                    [401, 403, 407].includes(result.status)
                )
                    // NOTE: We have an unauthenticated request.
                    this.triggerEvent(
                        'serverAuthenticationInvalid',
                        {reference: {request: rawData, response: result.data}}
                    )
                return result
            }
            this.handleUnsuccessfulSentRequest(result, rawData)
        }
        return result
    }
    /**
     * Send given data to server und interpret response.
     * @param event - Triggering event object.
     * @param data - Valid data given by the form.
     * @param newWindow - Indicates whether action targets should be opened
     * in a new window.
     * @returns Promise holding nothing.
     */
    async handleValidSubmittedInput(
        event:Event, data:PlainObject, newWindow:boolean = false
    ):Promise<void> {
        this.triggerEvent('validSubmit', {reference: data})
        // region prepare request
        this.resolvedConfiguration.data = data
        this.resolvedConfiguration.targetData = this.mapTargetNames(data)
        const target:TargetConfiguration = Tools.evaluateDynamicData(
            Tools.copy(this.resolvedConfiguration.target),
            {
                determineStateURL: this.determineStateURL,
                Tools,
                ...this.resolvedConfiguration
            }
        ) as TargetConfiguration
        // endregion
        if (target?.url) {
            this.determinedTargetURL = target.url
            if (target.options.body && typeof target.options.body !== 'string')
                target.options.body = JSON.stringify(target.options.body)
            this.latestResponse = this.response = null
            await this.startBackgroundProcess(event)
            // region trigger request
            this.latestResponse =
            this.response =
                await this.doRequest(target, data)
            if (this.response && this.response.ok && this.response.data)
                /*
                    NOTE: When redirecting to new page on the current active
                    window we can ignore html representation updates.
                */
                if (this.handleValidSentData(data, newWindow) && !newWindow)
                    /*
                        NOTE: We do not want to show something if a redirection
                        happens in current browser instance.
                    */
                    return
            // endregion
        } else {
            this.determinedTargetURL = null
            await this.startBackgroundProcess(event)
            if (this.resolvedConfiguration.debug)
                console.debug('Retrieved data:', Tools.represent(data))
        }
        await this.stopBackgroundProcess(event)
    }
    /**
     * Maps given field names to endpoint's expected ones.
     * @param - Data to transform.
     * @returns Resulting transformed data.
     */
    mapTargetNames(data:PlainObject):PlainObject {
        const result:PlainObject = {}
        for (const name in data)
            if (data.hasOwnProperty(name))
                if (
                    this.models.hasOwnProperty(name) &&
                    this.models[name].hasOwnProperty('target')
                ) {
                    if (
                        typeof this.models[name].target === 'string' &&
                        (this.models[name].target as string).length
                    )
                        result[this.models[name].target as keyof PlainObject] =
                            data[name]
                } else
                    result[name] = data[name]
        return result
    }
    /**
     * Check validation state of all content projected inputs, represents
     * overall validation state and sends data to configured target.
     * @param event - Triggered event object.
     * @returns Nothing.
     */
    onSubmit = async (event:KeyboardEvent|MouseEvent):Promise<void> => {
        try {
            event.preventDefault()
            event.stopPropagation()

            if (this.submitted || this.pending)
                return

            this.invalid = true
            this.valid = !this.invalid

            const target:HTMLElement|null = this.submitButtons.length ?
                this.submitButtons[0] :
                event.target as HTMLElement
            const newWindow:boolean = target ?
                target.getAttribute('target') === '_blank' :
                false

            this.setAttribute('submitted', '')
            if (this.reCaptchaFallbackRendered)
                this.setAttribute('re-captcha-fallback-rendered', '')

            await this.resetAllHiddenNonPersistentInputs()

            const {data, invalidInputNames} = this.getData()

            if (invalidInputNames.length) {
                // Trigger input components to present their validation state.
                for (const name in this.inputs)
                    if (this.inputs.hasOwnProperty(name))
                        this.inputs[name].showInitialValidationState = true
                this.handleInvalidSubmittedInput(data, invalidInputNames)
            } else if (
                this.reCaptchaFallbackRendered &&
                this.reCaptchaFallbackInput!.hasAttribute('invalid')
            ) {
                this.updateMessageBox('Please do the re-captcha challenge.')
                this.scrollAndFocus(
                    this.reCaptchaFallbackInput as AnnotatedDomNode
                )
            } else {
                this.resolvedConfiguration.reCaptcha.token =
                    (await this.reCaptchaPromise) || ''

                this.onceSubmitted = this.submitted = true

                this.invalid = false
                this.valid = !this.invalid

                const fieldValues:Array<any> =
                    this.modelNames.map((name:string):any => this.models[name])
                const values:Array<any> = [
                    this.determineStateURL,
                    this.determinedTargetURL,
                    this.getData,
                    this.initialResponse,
                    this.invalid,
                    this.latestResponse,
                    this.pending,
                    this.response,
                    this.message,
                    this.onceSubmitted,
                    Tools,
                    this.valid,
                    ...fieldValues
                ]
                const scope:Mapping<any> = this.self.baseScopeNames
                    .concat(this.modelNames)
                    .reduce(
                        (
                            scope:Mapping<any>, name:string, index:number
                        ):Mapping<any> => {
                            scope[name] = values[index]
                            return scope
                        },
                        {}
                    )

                for (
                    const constraint of this.resolvedConfiguration.constraints
                ) {
                    const evaluatedConstraint:EvaluationResult =
                        Tools.stringEvaluate(constraint.evaluation, scope)
                    if (evaluatedConstraint.error)
                        throw new Error(evaluatedConstraint.error)
                    if (!evaluatedConstraint.result) {
                        this.updateMessageBox(constraint.description)

                        this.invalid = true
                        this.valid = !this.invalid

                        break
                    }
                }

                if (this.valid) {
                    this.updateMessageBox(null)
                    await this.handleValidSubmittedInput(
                        event, data, newWindow
                    )
                } else
                    this.triggerEvent(
                        'invalidSubmit', {reference: {data, invalidInputNames}}
                    )

                this.submitted = false
            }
        } catch (error) {
            console.warn(`Submitting failed: ${Tools.represent(error)}`)
        }
    }
    // / endregion
    // / region inter component interaction
    /**
     * Add all needed field event listener to trigger needed checks and start
     * dependent field change cascade.
     * @returns Nothing.
     */
    applyInputBindings():void {
        const scope:{
            instance:AgileForm
            name:string
            Tools:typeof Tools
        } = {instance: this, name: 'UNKNOWN_NAME', Tools}

        for (const name in this.inputs) {
            scope.name = name
            this.applyBindings(this.inputs[name], scope)

            if (
                this.inputs.hasOwnProperty(name) &&
                !this.inputEventBindings.hasOwnProperty(name)
            ) {
                const eventName:string =
                    this.models[name].hasOwnProperty('changedEventName') ?
                        this.models[name].changedEventName as string :
                        'change'
                const handler:EventListener = Tools.debounce(
                    async (event:Event):Promise<void> => {
                        await this.digest()
                        let tools:Tools
                        if (this.dependencyMapping[name].length) {
                            tools = new Tools()
                            await tools.acquireLock('digest')
                            await this.updateInputDependencies(name, event)
                        }
                        this.updateAllGroups()
                        if (this.dependencyMapping[name].length)
                            await tools!.releaseLock('digest')
                    },
                    400
                )
                this.inputs[name].addEventListener(eventName, handler)
                this.inputEventBindings[name] = ():void => {
                    this.inputs[name].removeEventListener(eventName, handler)
                    delete this.inputEventBindings[name]
                }
            }
        }
    }
    /**
     * Updates all fields.
     * @param event - Triggering event object.
     * @returns Promise holding nothing.
     */
    async updateAllInputs(event:Event):Promise<void> {
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name))
                await this.updateInput(name, event)
    }
    /**
     * Updates given input (by name) dynamic expression and its visibility
     * state.
     * @param name - Field name to update.
     * @param event - Triggering event object.
     * @returns A Promise resolving to a boolean indicator whether a state
     * changed happened or not.
     */
    async updateInput(name:string, event:Event):Promise<boolean> {
        // We have to check for real state changes to avoid endless loops.
        let changed:boolean = false
        if (this.models[name].hasOwnProperty('dynamicExtend'))
            for (const key in this.models[name].dynamicExtend) {
                const oldValue:any = this.models[name][key as keyof Model]
                const newValue:any =
                    this.models[name].dynamicExtend![key](event)
                if (oldValue !== newValue) {
                    changed = true
                    if (key !== 'value')
                        this.models[name][key as keyof Model] = newValue
                    if (
                        this.self.specificationToPropertyMapping
                            .hasOwnProperty(key)
                    )
                        (
                            this.inputs[name][
                                this.self.specificationToPropertyMapping[
                                    key
                                ].name as keyof ModelAnnotation
                            ] as ValueOf<ModelAnnotation>
                        ) = (
                            this.self.specificationToPropertyMapping[key]
                                .invert ?
                                    !newValue :
                                    newValue
                        )
                    else
                        (
                            this.inputs[name][key as keyof ModelAnnotation] as
                                ValueOf<ModelAnnotation>
                        ) = newValue
                    await this.digest()
                }
            }
        if ((await this.updateInputVisibility(name)) || changed) {
            await this.triggerModelUpdate(name)
            await this.updateInputDependencies(name, event)
        }
        return changed
    }
    /**
     * Updates all related fields for given field name.
     * @param name - Field to check their dependent fields.
     * @returns Promise holding nothing.
     */
    async updateInputDependencies(name:string, event:Event):Promise<void> {
        for (const dependentName of this.dependencyMapping[name])
            await this.updateInput(dependentName, event)
    }
    /**
     * Trigger inputs internal change detection.
     * @param name - Field name to update their model.
     * @returns A promise resolving to nothing.
     */
    async triggerModelUpdate(name:string):Promise<void> {
        if (this.inputs.hasOwnProperty(name)) {
            if (typeof this.inputs[name].changeTrigger === 'function')
                this.inputs[name].changeTrigger()
            else if (Object.prototype.hasOwnProperty.call(
                this.inputs[name], 'changeTrigger'
            )) {
                this.inputs[name].changeTrigger =
                    !this.inputs[name].changeTrigger
                await this.digest()
            }
        } else
            console.warn(
                `Input node (to update corresponding model) for "${name}" ` +
                'not found.'
            )
    }
    // / endregion
    // / region utility
    /**
     * Derives event name from given event.
     * @param event - Event to derive name from.
     * @return Derived name.
     */
    determineEventName(
        event:Event & {detail?:{
            parameter?:Array<{type?:string}>
            type?:string
        }}
    ):string {
        if (event.detail) {
            if (
                Array.isArray(event.detail.parameter) &&
                event.detail.parameter.length
            ) {
                if (
                    event.detail.parameter.length > 1 &&
                    event.detail.parameter[1] &&
                    typeof event.detail.parameter[1].type === 'string'
                )
                    return event.detail.parameter[1].type
                if (
                    event.detail.parameter[0] &&
                    typeof event.detail.parameter[0].type === 'string'
                )
                    return event.detail.parameter[0].type
            }
            if (typeof event.detail.type === 'string')
                return event.detail.type
        }
        return typeof event.type === 'string' ? event.type : 'unknown'
    }
    /**
     * Generates scope based on generic expressions.
     * @param current - Current evaluation (to ignore).
     * @returns Evaluated scope.
     */
    evaluateExpressions(current?:string):Array<any> {
        const scope:Array<any> = []
        for (const evaluation of this.resolvedConfiguration.evaluations) {
            if (current === evaluation[0])
                break
            scope.push(evaluation[1]())
        }
        return scope
    }
    /**
     * Indicates a background running process. Sets "pending" property and
     * triggers a loading spinner.
     * @param event - Triggering event object.
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async startBackgroundProcess(event:Event):Promise<void> {
        this.showSpinner()
        this.pending = true
        await this.updateAllInputs(event)
        this.updateAllGroups()
    }
    /**
     * Stops indicating a background running process. Sets "pending" property
     * and stop showing a loading spinner.
     * @param event - Triggering event object.
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async stopBackgroundProcess(event:Event):Promise<void> {
        this.pending = false
        await this.updateAllInputs(event)
        this.updateAllGroups()
        this.hideSpinner()
    }
    /**
     * Determines whether the current value state can be derived by given
     * configuration or has to be saved.
     * @param name - Model name to derive from.
     * @returns A boolean indicating the neediness.
     */
    determinedStateValueIsNeeded(name:string):boolean {
        return !(
            this.inputs[name].initialValue &&
            this.inputs[name].initialValue === this.inputs[name].value ||
            this.inputs[name].initialValue === undefined &&
            this.inputs[name].value === this.inputs[name].default ||
            /*
                NOTE: If only a boolean value we do not have to save an
                explicit or implicit default.
            */
            !this.inputs[name].default &&
            !this.inputs[name].value &&
            this.inputs[name].type === 'boolean' &&
            /*
                NOTE: If only one possible state exists we do not have to save
                that state.
            */
            !(
                this.inputs[name].selection &&
                (
                    Array.isArray(this.inputs[name].selection) &&
                    this.inputs[name].selection.length > 1 ||
                    !Array.isArray(this.inputs[name].selection) &&
                    Object.keys(this.inputs[name].selection).length > 1
                )
            )
        )
    }
    /**
     * Determines current state url.
     * @returns URL.
     */
    determineStateURL = ():{encoded:string;plain:string} => {
        let parameter:Partial<Configuration> =
            {model: {}, ...(this.urlConfiguration || {})}

        for (const name in this.models)
            if (
                this.models.hasOwnProperty(name) &&
                this.inputs.hasOwnProperty(name) &&
                (
                    this.inputs[name].dirty ||
                    /*
                        NOTE: This input seems to have limited input state
                        support so we have to consider this.
                    */
                    this.inputs[name].dirty !== false &&
                    (
                        this.inputs[name].constructor as unknown as
                            StaticWebComponent
                    ).webComponentAdapterWrapped !== 'react'
                )
            )
                if (parameter.model!.hasOwnProperty(name)) {
                    if (
                        this.inputs[name].value !==
                            parameter.model![name as keyof Model].value
                    )
                        /*
                            NOTE: Initial values derived from existing state
                            url shouldn't be a problem because of the prior
                            condition.
                         */
                        if (this.determinedStateValueIsNeeded(name))
                            parameter.model![name].value =
                                this.models[name].serializer ?
                                    this.models[name].serializer!(
                                        this.inputs[name].value
                                    ) :
                                    this.inputs[name].value
                        else {
                            delete parameter.model![name as keyof Model].value
                            if (Object.keys(
                                parameter.model![name as keyof Model]
                            ).length === 0)
                                delete parameter.model![name]
                        }
                /*
                    NOTE: Initial values derived from existing state url
                    shouldn't be a problem because of the prior condition.
                 */
                } else if (this.determinedStateValueIsNeeded(name))
                    parameter.model![name] = {
                        value: this.models[name].serializer ?
                            this.models[name].serializer!(
                                this.inputs[name].value
                            ) :
                            this.inputs[name].value
                    }
        parameter = Tools.maskObject<Partial<Configuration>>(
            parameter, this.resolvedConfiguration.urlModelMask
        )
        if (parameter.model && Object.keys(parameter.model).length === 0)
            delete parameter.model
        let encodedURL:string = document.URL
        let url:string = document.URL
        if (Object.keys(parameter).length) {
            encodedURL = url = url.replace(
                new RegExp(
                    `[?&]${this.resolvedConfiguration.name}=[^&]*`, 'g'
                ),
                ''
            )

            // Ensure normalized urls via recursive property sorting.
            const keys:Array<string> = []
            JSON.stringify(
                parameter,
                (key:string, value:any):any => {
                    keys.push(key)
                    return value
                }
            )
            keys.sort()
            const value:string = JSON.stringify(parameter, keys, '')

            const encodedQueryParameter:string =
                `${this.resolvedConfiguration.name}=` +
                encodeURIComponent(value)
            const queryParameter:string =
                `${this.resolvedConfiguration.name}=${value}`
            if (url.includes('?')) {
                if (!(url.endsWith('?') || url.endsWith('&'))) {
                    encodedURL += '&'
                    url += '&'
                }
            } else {
                encodedURL += '?'
                url += '?'
            }
            encodedURL += encodedQueryParameter
            url += queryParameter
        }
        return {encoded: encodedURL, plain: url}
    }
    /**
     * Tracks given data if tracking environment exists.
     * @param name - Event name to trigger.
     * @param data - Data to track.
     * @returns Nothing.
     */
    triggerEvent(name:string, data:PlainObject):boolean {
        /*
            NOTE: We should forwarded runtime data to avoid unexpected behavior
            if gtm or configured tracking tool manipulates given data.
        */
        if (data.hasOwnProperty('reference'))
            data.reference = Tools.copy(data.reference)

        return this.dispatchEvent(new CustomEvent(name, {detail: data}))
    }
    /**
     * Renders user interaction re-captcha version if corresponding placeholder
     * is available.
     * @returns A boolean indicating if a fallback node was found to render.
     */
    updateReCaptchaFallbackToken():boolean {
        // NOTE: IE 11 sometimes does not load reCAPTCHA properly.
        if (window.grecaptcha && !window.grecaptcha.render && window.location)
            location.reload()

        if (
            window.grecaptcha &&
            this.reCaptchaFallbackInput &&
            (
                this.resolvedConfiguration.showAll ||
                this.resolvedConfiguration.reCaptcha?.key?.v2 &&
                this.resolvedConfiguration.target &&
                (this.resolvedConfiguration.target as TargetConfiguration).url
            )
        ) {
            this.reCaptchaPromise =
                new Promise((resolve:(result:null|string) => void):void => {
                    this.reCaptchaPromiseResolver = resolve
                })

            this.reCaptchaFallbackInput.removeAttribute('valid')
            this.reCaptchaFallbackInput.setAttribute('invalid', '')

            if (this.reCaptchaFallbackRendered)
                window.grecaptcha!.reset()
            else {
                this.reCaptchaFallbackInput.removeAttribute('dirty')
                this.reCaptchaFallbackInput.setAttribute('pristine', '')

                this.reCaptchaFallbackRendered = true
                /*
                    NOTE: We do not have to wait for the re-captcha ready event
                    since re-captcha 3 is always triggered first so we can
                    assume it is already there.
                */
                window.grecaptcha!.render(
                    this.reCaptchaFallbackInput,
                    {
                        callback: (token:string):void => {
                            this.reCaptchaToken = token
                            this.reCaptchaPromiseResolver(this.reCaptchaToken)

                            this.reCaptchaFallbackInput!
                                .removeAttribute('invalid')
                            this.reCaptchaFallbackInput!
                                .setAttribute('valid', '')

                            this.reCaptchaFallbackInput!
                                .removeAttribute('pristine')
                            this.reCaptchaFallbackInput!
                                .setAttribute('dirty', '')
                        },
                        sitekey: this.resolvedConfiguration.reCaptcha.key.v2
                    }
                )
                this.activate(this.reCaptchaFallbackInput)
            }
            return true
        } else
            this.reCaptchaPromise = Promise.resolve(null)
        return false
    }
    /**
     * Updates internal saved re-captcha token.
     * @returns Promise resolving to challenge token or null if initialisation
     * was unsuccessful.
     */
    updateReCaptchaToken():Promise<null|string> {
        if (this.reCaptchaFallbackRendered) {
            this.updateReCaptchaFallbackToken()
            return Promise.resolve(null)
        }

        if (this.reCaptchaToken) {
            // NOTE: If called second time reset initializing promise.
            this.reCaptchaToken = null
            this.reCaptchaPromise =
                new Promise((resolve:(result:null|string) => void):void => {
                    this.reCaptchaPromiseResolver = resolve
                })
        }

        if (
            window.grecaptcha &&
            this.resolvedConfiguration.reCaptcha?.key?.v3 &&
            this.resolvedConfiguration.target &&
            (this.resolvedConfiguration.target as TargetConfiguration).url
        )
            try {
                window.grecaptcha!.ready(async ():Promise<void> => {
                    try {
                        this.reCaptchaToken = await window.grecaptcha.execute(
                            this.resolvedConfiguration.reCaptcha.key.v3,
                            this.resolvedConfiguration.reCaptcha.action
                        )
                        this.reCaptchaPromiseResolver(this.reCaptchaToken)
                    } catch (error) {
                        this.reCaptchaToken = null
                        this.reCaptchaPromiseResolver(this.reCaptchaToken)
                    }
                })
            } catch (error) {
                console.warn(
                    `Could not retrieve a re-captcha token: "` +
                    `${Tools.represent(error)}".`
                )
            }
        else {
            this.reCaptchaToken = null
            this.reCaptchaPromiseResolver(this.reCaptchaToken)
        }
        return this.reCaptchaPromise
    }
    // / endregion
    // endregion
}
// endregion
export const api:WebComponentAPI<typeof AgileForm> = {
    component: AgileForm,
    register: (
        tagName:string = Tools.stringCamelCaseToDelimited(AgileForm._name)
    ):void => customElements.define(tagName, AgileForm)
}
export default api
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
