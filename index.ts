// #!/usr/bin/env node
// -*- coding: utf-8 -*-
/** @module agile-form */
'use strict'
/* !
    region header
    [Project page]https://bitbucket.org/leaserad/cms)

    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See http://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import Tools, {globalContext} from 'clientnode'
import {
    EvaluationResult, Mapping, PlainObject, RecursiveEvaluateable
} from 'clientnode/type'
import {object} from 'clientnode/property-types'
import Web from 'web-component-wrapper/Web'
import {WebComponentAPI} from 'web-component-wrapper/type'
import {CircularSpinner} from 'web-input-material/components/CircularSpinner'
import {GenericInput} from 'web-input-material/components/GenericInput'
import {
    RequireableCheckbox
} from 'web-input-material/components/RequireableCheckbox'
import {StaticFunctionInputComponent} from 'web-input-material/type'

import {
    Action,
    AnnotatedDomNode,
    Configuration,
    Model,
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
 * @property groupTemplateCache - Cache of group template contents.

 * @property initialData - Initialed form input values.
 * @property initialResponse - Initialisation server response.
 * @property latestResponse - Last seen server response.
 * @property message - Current error message about unsatisfied given
 * specification.
 * @property response - Current parsed response from send form data.

 * @property models - Mapping from field name to corresponding configuration.
 * @property modelNames - Specified transformer environment variable names.

 * @property onceSubmitted - Indicates whether this form was submitted once
 * already.
 * @property pending - Indicates whether a request is currently running.
 * @property submitted - Indicates whether this form state was submitted
 * already.

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
 */
export class AgileForm extends Web {
    static baseScopeNames:Array<string> = [
        'determineStateURL',
        'getData',
        'initialResponse',
        'latestResponse',
        'pending',
        'response',
        'stateMessage',
        'submitted',
        'tools'
    ]
    static content:string = '<form novalidate><slot></slot></form>'
    static defaultConfiguration:RecursiveEvaluateable<Configuration> = {
        actions: {},
        animation: true,
        constraints: [],
        conversionValue: {
            submit: 0,
            successful: 1
        },
        data: null,
        debug: false,
        evaluations: [],
        eventNameMapping: {
            inputInvalid: 'formInputInvalid',
            name: 'AgileForm',
            reCaptchaCheckFailed: 'formReCaptchaCheckFailed',
            reCaptchaFallbackCheckFailed: 'formReCaptchaFallbackCheckFailed',
            serverAuthenticationInvalid: 'formServerAuthenticationInvalid',
            serverEMailAddressInvalid: 'formServerEMailAddressInvalid',
            serverUnexpected: 'formServerUnexpected',
            submit: 'formSubmit',
            submitSuccessful: 'formSubmitSuccessful'
        },
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
            options: {
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
            inputs: 'generic-input, requireable-checkbox',
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
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Re-Captcha-Response': {
                        __evaluate__: 'reCaptcha.token'
                    },
                    'Re-Captcha-Skip': {
                        __evaluate__: 'reCaptcha.skip'
                    },
                    'Re-Captcha-Skip-Secret': {
                        __evaluate__: 'reCaptcha.secret '
                    }
                },
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
    static propertyTypes:Mapping<ValueOf<typeof PropertyTypes>> = {
        baseConfiguration: object,
        configuration: object,
        dynamicConfiguration: object
    }
    static specificationToPropertyMapping:PlainObject = {
        nullable: {
            invert: true,
            name: 'required'
        }
    }
    static observedAttributes:Array<string> = [
        'base-configuration', 'configuration', 'dynamic-configuration'
    ]

    clearButtons:Array<AnnotatedDomNode> = []
    inputs:{[key:string]:AnnotatedDomNode} = {}
    resetButtons:Array<AnnotatedDomNode> = []
    spinner:Array<AnnotatedDomNode> = []
    statusMessageBoxes:Array<AnnotatedDomNode> = []
    submitButtons:Array<AnnotatedDomNode> = []
    truncateButtons:Array<AnnotatedDomNode> = []

    dependencyMapping:{[key:string]:Array<string>} = {}

    groups:Map<HTMLElement, {
        childNames:Array<string>
        showIf?:Function
    }> = new Map()
    groupTemplateCache:Map<HTMLElement, string> = new Map()

    initialData:PlainObject = {}
    initialResponse:any = null
    latestResponse:any = null
    message:string = ''
    response:any = null

    models:PlainObject = {}
    modelNames:Array<string> = []

    onceSubmitted:boolean = false
    pending:boolean = true
    submitted:boolean = false

    reCaptchaFallbackInput:HTMLElement|null = null
    reCaptchaFallbackRendered:boolean = false
    reCaptchaPromise:Promise<null|string> = new Promise(
        (resolve:(result:null|string) => void):void => {
            this.reCaptchaPromiseResolver = resolve
        }
    )
    // NOTE: Will be initialized when promise is created.
    // reCaptchaPromiseResolver:(result:null|string) => void
    reCaptchaPromiseToken:null|string = null

    resolvedConfiguration:Configuration = {} as Configuration
    urlConfiguration:null|PlainObject = null

    readonly self:typeof AgileForm = AgileForm
    // region live cycle hooks
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

        this.initialized = false
    }
    /**
     * Triggered when content projected and nested dom nodes are ready to be
     * traversed. Selects all needed dom nodes.
     * @returns A promise resolving to nothing.
     */
    async render():Promise<void> {
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

        await this.stopBackgroundProcess(new Event('render'))
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
     * Adds given dom nodes visual reporesentation.
     * @param domNode - Node to activate.
     * @returns Nothing.
     */
    activate(domNode:AnnotatedDomNode):void {
        this.fade(domNode)
    }
    /**
     * Removes given dom nodes visual reporesentation.
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
        const oldState:boolean|undefined = this.models[name].shown
        this.inputs[name].shown =
        this.models[name].shown =
            !this.models[name].showIf ||
            this.models[name].showIf!()
        if (this.models[name].shown !== oldState) {
            if (this.resolvedConfiguration.debug)
                if (Boolean(oldState) === oldState)
                    console.debug(
                        `Update input "${name}" visibility state from ` +
                        `"${oldState ? 'show' : 'hide'}" to "` +
                        (this.models[name].shown ? 'show' : 'hide') +
                        '".'
                    )
                else
                    console.debug(
                        `Initialize input "${name}" visibility state to "` +
                        (this.models[name].shown ? 'show' : 'hide') +
                        '".'
                    )
            if (this.models[name].shown || this.resolvedConfiguration.showAll)
                this.activate(this.inputs[name])
            else {
                if (this.models[name].valuePersistence === 'resetOnHide')
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
                showIf?:Function
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
                    this.updateGroupContent(domNode, name)
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
                    this.updateGroupContent(domNode, name)
                this.fade(domNode)
            } else
                this.fade(domNode, 0)
        })
    }
    /**
     * Evaluate dynamic text content.
     * @param domNode - Dom node to render its content.
     * @param name - Name describing this node.
     * @returns Nothing.
     */
    updateGroupContent(
        domNode:AnnotatedDomNode, name:string = 'unknown'
    ):void {
        const nodeName:string = domNode.nodeName.toLowerCase()
        if (
            ['a', '#text'].includes(nodeName) &&
            !this.groupTemplateCache.has(domNode)
        ) {
            const content:null|string = nodeName === 'a' ?
                domNode.getAttribute('href') :
                domNode.textContent
            // NOTE: First three conditions are only for performance.
            if (
                typeof content === 'string' &&
                content.includes('${') &&
                content.includes('}') &&
                /\$\{.+\}/.test(content)
            )
                this.groupTemplateCache.set(
                    domNode, content.replace(/&nbsp;/g, ' ').trim()
                )
        }
        if (this.groupTemplateCache.has(domNode)) {
            const [scopeNames, template] = Tools.stringCompile(
                `\`${this.groupTemplateCache.get(domNode)}\``,
                this.self.baseScopeNames.concat(
                    this.resolvedConfiguration.expressions.map(
                        (expression:Array<string>):string => expression[0]
                    ),
                    this.modelNames
                )
            )
            if (typeof template === 'string')
                console.warn(
                    'Error occured during compiling text content for "' +
                    `${name}": ${template}`
                )
            else {
                let output:null|string = null
                try {
                    output = template(
                        this.determineStateURL,
                        this.getData,
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        ...this.evaluateExpressions(),
                        ...this.modelNames.map((name:string):any =>
                            this.models[name]
                        )
                    )
                } catch (error) {
                    console.warn(
                        'Error occured when running "' +
                        `${this.groupTemplateCache.get(domNode)}": for "` +
                        `${name}" with bound names "` +
                        `${scopeNames.join('", "')}": "` +
                        `${Tools.represent(error)}".`
                    )
                }
                if (output)
                    if (nodeName === 'a')
                        domNode.setAttribute('href', output)
                    else
                        domNode.textContent = output
             }
        }
        // Render content of each nested node.
        let currentDomNode:ChildNode|null = domNode.firstChild
        while (currentDomNode) {
            // NOTE: Avoid updating nested nodes which are groups by their own.
            if (
                currentDomNode.nodeName.toLowerCase() !==
                this.resolvedConfiguration.selector.groups
            )
                this.updateGroupContent(
                    currentDomNode as AnnotatedDomNode, name
                )
            currentDomNode = currentDomNode.nextSibling
        }
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
            {},
            this.resolvedConfiguration.target,
            this.resolvedConfiguration.initializeTarget
        )

        if (this.resolvedConfiguration.debug)
            console.debug('Got configuration:', this.resolvedConfiguration)
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
        this.addEventListener()
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
        const inputs:Array<AnnotatedDomNode> =
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
                domNode.model = Tools.copy(this.models[name])
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
                    !domNode.value &&
                    (domNode.initialValue || this.models[name].default)
                )
                    domNode.value =
                        domNode.initialValue ?? this.models[name].default
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
            Set all environment variables as dependencies for computed fields
            and pre compile them.
        */
        for (const name in this.models)
            if (
                this.models[name].hasOwnProperty('dependsOn') &&
                this.models[name].dependsOn === null
            ) {
                this.models[name].dependsOn = this.modelNames
                this.preCompileShowIfExpression(name)
                this.preCompileDynamicExtendStructure(name)
            }
        return missingInputs
    }
    /**
     * Whenever a component is re-configured a digest is needed to ensure that
     * its internal state has been reflected.
     * @returns A promise resolving when digest hast been finished.
    */
    digest():ReturnType<Tools.timeout> {
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
        const scopeNames:Array<string> = this.self.baseScopeNames
            .concat(
                this.resolvedConfiguration.expressions.map(
                    (expression:Array<string>):string => expression[0]
                ),
                this.modelNames
            )
            .map((name:string):string =>
                Tools.stringConvertToValidVariableName(name)
            )
        for (const domNode of groups) {
            const specification:{
                childNames:Array<string>
                showIf?:Function
            } = {
                childNames: (Array.from(domNode.querySelectorAll(
                    this.resolvedConfiguration.selector.inputs
                )) as Array<AnnotatedDomNode>)
                    .filter((domNode:AnnotatedDomNode):boolean =>
                        typeof domNode.getAttribute('name') === 'string'
                    )
                    .map((domNode:AnnotatedDomNode):string =>
                        domNode.getAttribute('name') as string
                    )
            }
            if (domNode.getAttribute('show-if')) {
                const code:string =
                    (domNode.getAttribute('show-if') as string)
                    .replace(/(#039;)|(&amp;)/g, '&')
                    .replace(/<br\/>/g, '')
                let name:string = 'UNKNOWN'
                if (typeof domNode.getAttribute('name') === 'string')
                    name = domNode.getAttribute('name') as string

                const preCompiled:Function|string =
                    Tools.stringCompile(code, scopeNames)[1]

                if (typeof preCompiled === 'string')
                    console.error(
                        'Failed to compile "show-if" group expression ' +
                        `attribute "${name}": ${preCompiled}`
                    )
                else
                    specification.showIf = ():boolean => {
                        try {
                            return Boolean(preCompiled(
                                this.determineStateURL,
                                this.getData,
                                this.initialResponse,
                                this.latestResponse,
                                this.pending,
                                this.response,
                                this.message,
                                this.onceSubmitted,
                                Tools,
                                ...this.evaluateExpressions(),
                                ...this.modelNames.map((name:string):any =>
                                    this.models[name]
                                )
                            ))
                        } catch (error) {
                            console.error(
                                `Failed to evaluate "${code}" with bound "` +
                                `names "${scopeNames.join('", "')}": "` +
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
     * Pre-compiles specified given transformer expression for given field.
     * @param name - Field name to pre-compile their expression.
     * @returns Nothing.
     */
    preCompileTransformerExpression(name:string):void {
        if (this.models[name].transformerExpression) {
            const code:string =
                this.models[name].transformerExpression as string
            const [scopeNames, preCompiled] = Tools.stringCompile(
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
            if (typeof preCompiled === 'string')
                console.error(
                    `Failed to compile "transformerExpression" "${name}":`,
                    preCompiled
                )
            this.models[name].transformer = (value:any):any => {
                if ([null, undefined].includes(value))
                    return value
                try {
                    return (preCompiled as Function)(
                        this.determineStateURL,
                        this.getData,
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.models[name],
                        value,
                        ...this.evaluateExpressions(),
                        ...(this.models[name].dependsOn || [])
                            .map((name:string):any => this.models[name])
                    )
                } catch (error) {
                    console.warn(
                        `Failed running "transformerExpression" "${code}" ` +
                        `for field "${name}" with bound names "` +
                        `${scopeNames.join('", "')}": "` +
                        `${Tools.represent(error)}".`
                    )
                }
                return value
            }
        }
    }
    /**
     * Pre-compiles specified given show if expression for given field.
     * @param name - Field name to pre-compile their expression.
     * @returns Nothing.
     */
    preCompileShowIfExpression(name:string):void {
        if (this.models[name].showIfExpression) {
            const code:string = this.models[name].showIfExpression as string
            const [scopeNames, preCompiled] = Tools.stringCompile(
                code,
                this.self.baseScopeNames.concat(
                    'self',
                    this.resolvedConfiguration.expressions.map(
                        (expression:Array<string>):string => expression[0]
                    ),
                    this.models[name].dependsOn || []
                )
            )
            if (typeof preCompiled === 'string')
                console.error(
                    `Failed to compile "showIf" expression "${name}":`,
                    preCompiled
                )
            this.models[name].showIf = ():boolean => {
                try {
                    return Boolean((preCompiled as Function)(
                        this.determineStateURL,
                        this.getData,
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.models[name],
                        ...this.evaluateExpressions(),
                        ...(this.models[name].dependsOn || [])
                            .map((name:string):any => this.models[name]
                        )
                    ))
                } catch (error) {
                    console.error(
                        `Failed running "showIf" expression "${code}" for` +
                        ` field "${name}" with bound names "` +
                        `${scopeNames.join('", "')}": "` +
                        `${Tools.represent(error)}".`
                    )
                }
                return false
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
                let scopeNames = this.self.baseScopeNames.concat(
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
                let preCompiled:Function|null|string = null
                if (typeof code === 'string') {
                    [scopeNames, preCompiled] = Tools.stringCompile(
                        code, scopeNames
                    )
                    if (typeof preCompiled === 'string')
                        console.error(
                            `Failed to compile "dynamicExtendExpression" for` +
                            ` property "${subName}" in field "${name}":`,
                            preCompiled
                        )
                }
                this.models[name].dynamicExtend![subName] = (
                    event:Event
                ):any => {
                    const scope:Mapping<any> = {}
                    const context:Array<any> = [
                        this.determineStateURL,
                        this.getData,
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
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
                            (preCompiled as Function)(...context)
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
        const scopeNames:Array<string> = this.self.baseScopeNames
            .concat(
                this.resolvedConfiguration.expressions.map(
                    (expression:Array<string>):string => expression[0]
                ),
                this.modelNames
            )
            .map((name:string):string =>
                Tools.stringConvertToValidVariableName(name)
            )
        for (const name in this.resolvedConfiguration.actions)
            if (this.resolvedConfiguration.actions.hasOwnProperty(name)) {
                const code:string =
                    this.resolvedConfiguration.actions[name].code
                if (code.trim() === 'fallback')
                    continue
                const preCompiled:Function|string =
                    Tools.stringCompile(code, scopeNames)[1]
                if (typeof preCompiled === 'string')
                    console.error(
                        `Failed to compile action source expression "${name}` +
                        `": ${preCompiled}`
                    )
                this.resolvedConfiguration.actions[name].indicator = (
                ):any => {
                    try {
                        return (preCompiled as Function)(
                            this.determineStateURL,
                            this.getData,
                            this.initialResponse,
                            this.latestResponse,
                            this.pending,
                            this.response,
                            this.message,
                            this.onceSubmitted,
                            Tools,
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
            const [scopeNames, preCompiled] = Tools.stringCompile(
                code,
                this.self.baseScopeNames.concat(
                    expressionNames, this.modelNames
                )
            )
            expressionNames.push(name)
            if (typeof preCompiled === 'string')
                console.error(
                    `Failed to compile generic expression "${name}":`,
                    preCompiled
                )
            this.resolvedConfiguration.evaluations.push([name, ():any => {
                try {
                    return (preCompiled as Function)(
                        this.determineStateURL,
                        this.getData,
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
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
                this.preCompileTransformerExpression(name)
                this.preCompileShowIfExpression(name)
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
    /**
     * Callback triggered when any keyboard events occur.
     * @param event - Keboard event object.
     * @returns Nothing.
     */
    onKeyDown = (event:KeyboardEvent):void => {
        if (Tools.keyCode.ENTER === event.keyCode)
            this.onSubmit(event)
    }
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
                        if (
                            typeof this.models[name].dataMapping === 'string'
                        ) {
                            const evaluated:EvaluationResult =
                                Tools.stringEvaluate(
                                    this.models[name].dataMapping as string,
                                    {item: value}
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
                                ).hasOwnProperty(subName))
                                    data[subName] = value[(
                                        this.models[name].dataMapping as
                                            Mapping
                                    )[subName]]
                    } else
                        data[name] = value
            }
        return {data, invalidInputNames}
    }
    /**
     * Calculates current document relative offset of given dom node's
     * position.
     * @param domNode - Target node to calculate from.
     * @returns Calculated values.
     */
    getOffset(domNode:AnnotatedDomNode):{left:number;top:number} {
        const documentNode:HTMLElement = document.documentElement
        const box = domNode.getBoundingClientRect()
        return {
            left: box.left + window.pageXOffset - documentNode.clientLeft,
            top: box.top + window.pageYOffset - documentNode.clientTop
        }
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
        const invalidInputs:Array<AnnotatedDomNode> = Array.from(
            this.root.querySelectorAll(
                `[name="${invalidInputNames.join('"], [name="')}"]`
            )
        )
        if (invalidInputs.length)
            this.scrollAndFocus(invalidInputs[0])
    }
    /**
     * Scrolls to given element and focuses it.
     * @param targetDomNode - Dom node to scroll to.
     * @returns a Promise resolving when focusing has finished.
     */
    scrollAndFocus(targetDomNode:AnnotatedDomNode):Promise<void> {
        const offset = this.getOffset(targetDomNode)
        const newScrollPosition = Math.max(
            0, offset.top - this.resolvedConfiguration.offsetInPixel
        )
        // TODO: make this nice (without jquery)
        const $window = require('jquery')('html, body')
        // Workaround since jquery triggers animation callback twice.
        let run:boolean = false
        return new Promise((resolve:Function):void => $window.animate(
            {scrollTop: newScrollPosition},
            'slow',
            ():void => {
                if (run)
                    return
                run = true
                $window.animate({scrollTop: newScrollPosition}, 0)
                if (typeof targetDomNode.focus === 'function')
                    targetDomNode.focus()
            }
        ))
        //---
    }
    /**
     * Handle valid sent data and redirects to corresponding specified target
     * page.
     * @param data - Data given by the form.
     * @param newWindow - Indicates whether action targets should be opened
     * in a new window.
     * @returns Redirection target.
     */
    handleValidSentData(data:PlainObject, newWindow:boolean = false):string {
        this.track({
            event:
                this.resolvedConfiguration.eventNameMapping.submitSuccessful,
            eventType: 'formSubmitSuccessful',
            label: 'formSubmitSuccessful',
            reference: {
                request: data,
                response: this.response.data
            },
            value: this.resolvedConfiguration.conversionValue.successful
        })
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
            this.track({
                event:
                    this.resolvedConfiguration.eventNameMapping
                        .serverEMailAddressInvalid,
                eventType: 'serverInvalidEMailAddress',
                label: 'serverInvalidEMailAddress',
                reference: {
                    request: rawData,
                    response: response.data
                }
            })
        else if (response && [401, 403].includes(response.status))
            // NOTE: We have an unauthenticated request.
            this.track({
                event:
                    this.resolvedConfiguration.eventNameMapping
                        .serverAuthenticationInvalid,
                eventType: 'serverAuthenticationInvalid',
                label: 'serverAuthenticationInvalid',
                reference: {
                    request: rawData,
                    response: response.data
                }
            })
        else if (response && response.status === 420) {
            this.updateReCaptchaFallbackToken()
            if (this.reCaptchaFallbackRendered)
                // NOTE: We had an unsuccessful re-captcha challenge.
                this.track({
                    event:
                        this.resolvedConfiguration.eventNameMapping
                            .reCaptchaFallbackCheckFailed,
                    eventType: 'serverReCaptchaFallbackCheckFailed',
                    label: 'serverReCaptchaFallbackCheckFailed',
                    reference: {
                        request: rawData,
                        response: response.data
                    }
                })
            else
                this.track({
                    event:
                        this.resolvedConfiguration.eventNameMapping
                            .reCaptchaCheckFailed,
                    eventType: 'serverReCaptchaCheckFailed',
                    label: 'serverReCaptchaCheckFailed',
                    reference: {
                        request: rawData,
                        response: response.data
                    }
                })
        } else if (response && response.status === 428)
            // NOTE: We have sent an outdated form.
            this.track({
                event:
                    this.resolvedConfiguration.eventNameMapping
                        .serverFormOutdated,
                eventType: 'serverFormOutdated',
                label: 'serverFormOutdated',
                reference: {
                    request: rawData,
                    response: response.data
                }
            })
        else
            // NOTE: Unexpected server error.
            this.track({
                event:
                    this.resolvedConfiguration.eventNameMapping
                        .serverUnexpected,
                eventType: 'serverReCaptchaCheckFailed',
                label: 'serverReCaptchaCheckFailed',
                reference: {
                    request: rawData,
                    response: response && response.data || null
                }
            })
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
            target.hasOwnProperty('options') &&
            target.options !== null &&
            target.options.hasOwnProperty('headers') &&
            target.options.headers !== null
        ) {
            const headers:Headers = new Headers()
            for (const name in target.options.headers)
                if (
                    target.options.headers.hasOwnProperty(name) &&
                    ['boolean', 'number', 'string'].includes(
                        typeof target.options.headers[name]
                    ) &&
                    `${target.options.headers[name]}`.trim()
                )
                    headers.set(name, target.options.headers[name])
            target.options.headers = headers
        }
        // endregion
        let result:null|Response = null
        try {
            this.updateReCaptchaToken()
            result = await fetch(target.url, target.options || {})
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
                    this.track({
                        event:
                            this.resolvedConfiguration.eventNameMapping
                                .serverAuthenticationInvalid,
                        eventType: 'serverAuthenticationInvalid',
                        label: 'serverAuthenticationInvalid',
                        reference: {
                            request: rawData,
                            response: result.data
                        }
                    })
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
        if (this.resolvedConfiguration.target?.url) {
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
            )
            if (target.options.body && typeof target.options.body !== 'string')
                target.options.body = JSON.stringify(target.options.body)
            // endregion
            this.track({
                event: this.resolvedConfiguration.eventNameMapping.submit,
                eventType: 'formSubmit',
                label: 'formSubmit',
                reference: data,
                userInteraction: true,
                value: this.resolvedConfiguration.conversionValue.submit
            })
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
                this.reCaptchaFallbackInput.hasAttribute('invalid')
            ) {
                this.updateMessageBox('Please do the re-captcha challenge.')
                this.scrollAndFocus(this.reCaptchaFallbackInput)
            } else {
                this.resolvedConfiguration.reCaptcha.token =
                    await this.reCaptchaPromise

                this.onceSubmitted = this.submitted = true
                let valid: boolean = true

                const fieldValues:Array<any> =
                    this.modelNames.map((name:string):any => this.models[name])
                const values:Array<any> = [
                    this.determineStateURL,
                    this.getData,
                    this.initialResponse,
                    this.latestResponse,
                    this.pending,
                    this.response,
                    this.message,
                    this.onceSubmitted,
                    Tools,
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
                        valid = false
                        break
                    }
                }

                if (valid) {
                    this.updateMessageBox(null)
                    await this.handleValidSubmittedInput(
                        event, data, newWindow
                    )
                } else
                    this.track({
                        event:
                            this.resolvedConfiguration.eventNameMapping
                                .inputInvalid,
                        eventType: 'inputInvalid',
                        label: 'inputInvalid',
                        reference: data
                    })

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
    addEventListener():void {
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name))
                this.inputs[name].addEventListener(
                    (
                        this.models[name].hasOwnProperty('eventChangedName') ?
                            this.models[name].eventChangedName :
                            'onChange'
                    ),
                    async (event:Event):Promise<void> => {
                        await this.digest()
                        const tools:Tools = new Tools()
                        await tools.acquireLock('digest')
                        await this.updateInputDependencies(name, event)
                        this.updateAllGroups()
                        await tools.releaseLock('digest')
                    }
                )
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
                const oldValue:any = this.models[name][key]
                const newValue:any =
                    this.models[name].dynamicExtend[key](event)
                if (oldValue !== newValue) {
                    changed = true
                    if (key !== 'value')
                        this.models[name][key] = newValue
                    if (
                        this.self.specificationToPropertyMapping
                            .hasOwnProperty(key)
                    )
                        this.inputs[name][
                            this.self.specificationToPropertyMapping[key].name
                        ] = this.self.specificationToPropertyMapping[key]
                            .invert ?
                                !newValue :
                                newValue
                    else
                        this.inputs[name][key] = newValue
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
            if ('changeTrigger' in this.inputs[name]) {
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
    determineEventName(event:Event):string {
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
     * Determines current state url.
     * @returns URL.
     */
    determineStateURL = ():{encoded:string;plain:string} => {
        let parameter:PlainObject = {
            model: {},
            ...(this.urlConfiguration || {})
        }
        for (const name in this.models)
            if (
                this.models.hasOwnProperty(name) &&
                this.inputs.hasOwnProperty(name) &&
                this.inputs[name].dirty
            )
                if (parameter.model.hasOwnProperty(name)) {
                    if (
                        this.inputs[name].value !== parameter.model[name].value
                    )
                        if (
                            /*
                                NOTE: Do not compare to dom nodes initial value
                                because it could be derived from given model
                                value specification.
                            */
                            this.models[name].initialValue &&
                            this.models[name].initialValue ===
                                this.inputs[name].value ||
                            this.inputs[name].value ===
                                this.inputs[name].default ||
                            !this.inputs[name].default &&
                            /*
                                NOTE: If only a boolean value and two possible
                                states possible we do not have to save an
                                implicit default "false".
                            */
                            !this.inputs[name].value &&
                            this.inputs[name].type === 'boolean' &&
                            !(
                                this.inputs[name].selection &&
                                Array.isArray(this.inputs[name].selection) &&
                                this.inputs[name].selection.length > 2 ||
                                this.inputs[name].selection &&
                                !Array.isArray(this.inputs[name].selection) &&
                                Object.keys(this.inputs[name].selection)
                                    .length > 2
                            )
                        ) {
                            delete parameter.model[name].value
                            if (
                                Object.keys(parameter.model[name]).length === 0
                            )
                                delete parameter.model[name]
                        } else
                            parameter.model[name].value =
                                this.inputs[name].value
                } else if (!(
                    /*
                        NOTE: Do not compare to dom nodes initial value
                        because it could be derived from given model value
                        specification.
                    */
                    this.models[name].initialValue &&
                    this.models[name].initialValue ===
                        this.inputs[name].value ||
                    this.inputs[name].value === this.inputs[name].default
                ))
                    parameter.model[name] = {value: this.inputs[name].value}
        parameter = Tools.maskObject(
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
     * @param data - Data to track.
     * @returns Nothing.
     */
    track(data:PlainObject):void {
        if (Array.isArray(window.dataLayer)) {
            /*
                NOTE: We should forwarded runtime data to avoid unexpected
                behavior if gtm or configured tracking tool manipulates given
                data.
            */
            if (data.hasOwnProperty('reference'))
                data.reference = Tools.copy(data.reference)

            window.dataLayer.push({
                context: location.pathname,
                subject: this.resolvedConfiguration.eventNameMapping.name,
                value: 0,
                userInteraction: false,
                ...data
            })
        }
    }
    /**
     * Renders user interaction re-captcha version if corresponding placeholder
     * is available.
     * @returns Nothing.
     */
    updateReCaptchaFallbackToken():void {
        this.reCaptchaPromise =
            new Promise((resolve:(result:null|string) => void):void => {
                this.reCaptchaPromiseResolver = resolve
            })

        if (
            window.grecaptcha &&
            this.reCaptchaFallbackInput &&
            this.resolvedConfiguration.reCaptcha?.key?.v2 &&
            this.resolvedConfiguration.target?.url
        ) {
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

                            this.reCaptchaFallbackInput
                                .removeAttribute('invalid')
                            this.reCaptchaFallbackInput
                                .setAttribute('valid', '')

                            this.reCaptchaFallbackInput
                                .removeAttribute('pristine')
                            this.reCaptchaFallbackInput
                                .setAttribute('dirty', '')
                        },
                        sitekey : this.resolvedConfiguration.reCaptcha.key.v2
                    }
                )
                this.activate(this.reCaptchaFallbackInput)
                this.scrollAndFocus(this.reCaptchaFallbackInput)
            }
        }
    }
    /**
     * Updates internal saved re-captcha token.
     * @returns Promise resolving to challenge token or null if initialisation
     * was unsuccessful.
     */
    updateReCaptchaToken():Promise<null|string> {
        if (this.reCaptchaFallbackRendered)
            return this.updateReCaptchaFallbackToken()

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
            this.resolvedConfiguration.target?.url
        )
            try {
                window.grecaptcha!.ready(async ():Promise<void> => {
                    try {
                        this.reCaptchaToken = await window.grecaptcha.execute(
                            this.resolvedConfiguration.reCaptcha.key.v3,
                            this.resolvedConfiguration.reCaptcha.options
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
export const api:WebComponentAPI<AgileForm> = {
    component: AgileForm,
    register: (tagName:string = 'agile-form'):void =>
        customElements.define(tagName, AgileForm)
}
export default api
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
