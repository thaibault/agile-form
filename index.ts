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
 * @property static:defaultConfiguration - Holds default extendable
 * configuration object.
 * @property static:initialized - Indicates whether nested components have been
 * initialized yet.
 * @property static:specificationToPropertyMapping - Mapping model
 * specification keys to their corresponding input field property name (if not
 * equal).
 *
 * @property dependencyMapping - Mapping from each field to their dependent one.
 * @property groups - Mapping from group dom nodes to containing field names
 * and conditional show if expression.
 * @property inputs - Mapping from field names to their corresponding input
 * dom node.
 * @property message - Current error message about unsatisfied given
 * specification.
 * @property modelNames - Specified transformer environment variable names.
 * @property onceSubmitted - Indicates whether this form was submitted once
 * already.
 * @property pending - Indicates whether a request is currently running.
 * @property resetButtons - Reference to form reset button nodes.
 * @property resolvedConfiguration - Holds given configuration object.
 * @property response - Current parsed response from send form data.
 * @property spinner - Reference to a spinner dom node.
 * @property statusMessageBoxes - Reference to dom node which holds status
 * messages.
 * @property submitButtons - Reference to submit button nodes.
 * @property submitted - Indicates whether this form is currently submitted.
 */
export class AgileForm extends Web {
    static baseScopeNames:Array<string> = [
        'initialResponse',
        'latestResponse',
        'pending',
        'response',
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
        expressions: [],
        initializeTarget: {
            options: {method: 'GET'},
            url: ''
        },
        model: {},
        offsetInPixel: 85,
        reCaptcha: {
            key: '',
            options: {
                action: 'jForm'
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
            clearButtons: 'button[clear], [type=button]',
            groups: 'agile-group',
            inputs: 'generic-input, input, requireable-checkbox',
            resetButtons: 'button[reset], [type=button], [type=reset]',
            spinner: 'circular-spinner',
            statusMessageBoxes: '.agile-form__status-message',
            submitButtons: 'button[submit], [type=submit]'
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
                    'Re-Captcha': {
                        __evaluate__: 'reCaptcha.token'
                    },
                    'Re-Captcha-Skip': {
                        __evaluate__: 'reCaptcha.skip'
                    },
                    'Re-Captcha-Skip-Secret': {
                        __evaluate__: 'reCaptcha.secret '
                    },
                    'JobRad-Form-Register-Contact-Version': {
                        __evaluate__: 'version'
                    },
                    'JobRad-Form-Register-Contact-Tags': {
                        __evaluate__: 'tag.values.join()'
                    },
                    'JobRad-Form-Register-Contact-Tag-Secret': {
                        __evaluate__: 'tag.secret'
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
    static initialized:boolean|Promise<void> = false
    static propertyTypes:PropertyTypes = {
        baseConfiguration: object,
        configuration: object,
        dynamicConfiguration: object
    }
    static reCaptchaToken:string
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
    dependencyMapping:{[key:string]:Array<string>} = {}
    groups:Map<AnnotatedDomNode, {childNames:Array<string>;showIf?:Function}> =
        new Map()
    initialResponse:any = null
    inputs:{[key:string]:AnnotatedDomNode} = {}
    latestResponse:any = null
    message:string = ''
    modelNames:Array<string> = []
    onceSubmitted:boolean = false
    pending:boolean = true
    resetButtons:Array<AnnotatedDomNode> = []
    resolvedConfiguration:Configuration = {} as Configuration
    response:any = null
    readonly self:typeof AgileForm = AgileForm
    spinner:Array<AnnotatedDomNode> = []
    statusMessageBoxes:Array<AnnotatedDomNode> = []
    submitButtons:Array<AnnotatedDomNode> = []
    submitted:boolean = false
    urlConfiguration:null|PlainObject = null
    // region live cycle hooks
    /**
     * Initializes host specific event listener observations.
     * @returns Nothing.
     */
    constructor() {
        super()
        // Submit form after pressing the enter button on keyboard.
        window.addEventListener('keydown', (event:KeyboardEvent):void => {
            if (Tools.keyCode.ENTER === event.keyCode)
                this.submit(event)
        })
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
    async connectedCallback():Promise<void> {
        super.connectedCallback()
        await this.updateReCaptchaToken()
        this.self.initialized = true
    }
    /**
     * De-registers all needed event listener.
     * @returns Nothing.
     */
    disconnectedCallback():void {
        super.disconnectedCallback()

        for (const domNode of this.clearButtons)
            domNode.removeEventListener('click', this.clear.bind(this), false)
        for (const domNode of this.resetButtons)
            domNode.removeEventListener('click', this.reset.bind(this), false)
        for (const domNode of this.submitButtons)
            domNode.removeEventListener('click', this.submit.bind(this), false)
        this.self.initialized = false
    }
    /**
     * Triggered when content projected and nested dom nodes are ready to be
     * traversed. Selects all needed dom nodes.
     * @returns Nothing.
     */
    render():void {
        super.render()

        this.configureContentProjectedInputs()

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

        for (const domNode of this.clearButtons)
            domNode.addEventListener('click', this.clear.bind(this), false)
        for (const domNode of this.resetButtons)
            domNode.addEventListener('click', this.reset.bind(this), false)
        for (const domNode of this.submitButtons)
            domNode.addEventListener('click', this.submit.bind(this), false)
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
     * Updates all field visibility states.
     * @returns Nothing.
     */
    updateAllInputVisibilities():void {
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name))
                this.updateInputVisibility(name)
    }
    /**
     * Updates given field (by name) visibility state.
     * @param name - Field name to update.
     * @returns Boolean value indicating whether a visibility change has been
     * happen.
     */
    updateInputVisibility(name:string):boolean {
        const oldState:boolean|undefined =
            this.resolvedConfiguration.model[name].shown
        this.inputs[name].shown =
        this.resolvedConfiguration.model[name].shown =
            !this.resolvedConfiguration.model[name].showIf ||
            this.resolvedConfiguration.model[name].showIf!()
        if (this.resolvedConfiguration.model[name].shown !== oldState) {
            if (this.resolvedConfiguration.debug)
                if (Boolean(oldState) === oldState)
                    console.debug(
                        `Update input "${name}" visibility state from ` +
                        `"${oldState ? 'show' : 'hide'}" to "` +
                        (
                            this.resolvedConfiguration.model[name].shown ?
                                'show' :
                                'hide'
                        ) +
                        '".'
                    )
                else
                    console.debug(
                        `Initialize input "${name}" visibility state to "` +
                        (
                            this.resolvedConfiguration.model[name].shown ?
                                'show' :
                                'hide'
                        ) +
                        '".'
                    )
            if (
                this.resolvedConfiguration.model[name].shown ||
                this.resolvedConfiguration.showAll
            )
                this.activate(this.inputs[name])
            else {
                if (
                    this.resolvedConfiguration.model[name].valuePersistence ===
                        'resetOnHide'
                )
                    this.resetInput(name)
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
            specification:{childNames:Array<string>;showIf?:Function},
            domNode:AnnotatedDomNode
        ):void => {
            const oldState:null|boolean = domNode.shown
            domNode.shown = (
                specification.showIf &&
                specification.showIf() ||
                !specification.showIf &&
                (
                    specification.childNames.some((name:string):boolean =>
                        Boolean(
                            !this.resolvedConfiguration.model.hasOwnProperty(
                                name
                            ) ||
                            this.resolvedConfiguration.model[name].shown
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
                    domNode.getAttribute('name') ?
                        this.updateGroupContent(
                            domNode, domNode.getAttribute('name') as string
                        ) :
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
                    domNode.getAttribute('name') ?
                        this.updateGroupContent(
                            domNode, domNode.getAttribute('name') as string
                        ) :
                        this.updateGroupContent(domNode)
                this.fade(domNode)
            } else
                this.fade(domNode, 0)
        })
    }
    /**
     * Evaluate dynamic text content.
     * @returns Nothing.
     */
    updateGroupContent(
        domNode:AnnotatedDomNode, name:string = 'unknown'
    ):void {
        // NOTE: First two conditions are only for performance.
        const nodeName:string = domNode.nodeName.toLowerCase()
        if (['a', '#text'].includes(nodeName) && !domNode.templateContent) {
            const content:null|string = nodeName === 'a' ?
                domNode.getAttribute('href') :
                domNode.textContent
            if (
                typeof content === 'string' &&
                content.includes('${') &&
                content.includes('}') &&
                /\$\{.+\}/.test(content)
            )
                domNode.templateContent =
                    content.replace(/&nbsp;/g, ' ').trim()
        }
        if (domNode.templateContent) {
            const [scopeNames, template] = Tools.stringCompile(
                domNode.templateContent,
                this.self.baseScopeNames.concat(
                    this.resolvedConfiguration.expressions.map(
                        (expression:Array<string>):string => expression[0]
                    ),
                    this.modelNames,
                    'determineStateURL'
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
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.onceSubmitted,
                        Tools,
                        ...this.evaluateExpressions(),
                        ...this.modelNames.map((name:string):any =>
                            this.resolvedConfiguration.model[name]
                        ),
                        this.determineStateURL.bind(this)
                    )
                } catch (error) {
                    console.warn(
                        'Error occured when running "' +
                        `${domNode.templateContent}": for "${name}" with ` +
                        `bound names "${scopeNames.join('", "')}": "` +
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
        let currentDomNode:ChildNode|null = domNode.firstChild
        while (currentDomNode) {
            // NOTE: Nested groups should be rendered by their direct parent.
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
    updateMessageBox():void {
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

        for (const name of Object.keys(this.self.propertyTypes))
            Tools.extend(
                true, this.resolvedConfiguration, this[name as keyof AgileForm]
            )

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
    extendConfigurationByGivenURLParameter(name:string = 'jForm'):void {
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
            this.connectSpecificationWithDomNodes()
        // Configure input components to hide validation states first.
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name))
                this.inputs[name].showInitialValidationState = false
        this.preCompileConfigurationExpressions()
        this.setGroupSpecificConfigurations()
        /*
            NOTE: We need a digest loop to allow the components to extend given
            model object with their defaults.
        */
        await Tools.timeout()
        if (Object.keys(missingInputs).length)
            this.message =
                'Missing input for expected model name "' +
                `${Object.keys(missingInputs).join('", "')}".`
        this.updateMessageBox()
        this.createDependencyMapping()
        this.addEventValueUpdateListener()
        this.addEventListener()
        await this.stopBackgroundProcess()
    }
    /**
     * Determine all environment variables to ran expressions again. We have to
     * do this a second time to include dynamically added inputs in prototyping
     * mode.
     * @returns Nothing.
     */
    determineModelNames():void {
        this.modelNames = Object.keys(this.resolvedConfiguration.model)
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
    connectSpecificationWithDomNodes():Mapping<Model> {
        const inputs:Array<AnnotatedDomNode> =
            Array.from(this.root.querySelectorAll(
                this.resolvedConfiguration.selector.inputs
            ))
        // If no input is specified simply consider all provided inputs.
        const dummyMode:boolean =
            Object.keys(this.resolvedConfiguration.model).length === 0
        // Show all inputs in dummy mode.
        if (dummyMode)
            for (const domNode of inputs)
                this.activate(domNode)
        const missingInputs:Mapping<Model> =
            {...this.resolvedConfiguration.model}
        this.determineModelNames()
        this.inputs = {}
        let index:number = 0
        /*
            Match all found inputs against existing specified fields or load
            not specified input into the specification (model configuration).
        */
        for (const domNode of inputs) {
            const name:string|null = domNode.getAttribute('name')
            if (name) {
                if (this.resolvedConfiguration.model.hasOwnProperty(name)) {
                    /*
                        Found input is specified: Extend existing configuration
                        with forms specification.
                        NOTE: We need nested "Tools.extend" calls to control
                        order of extending.
                    */
                    if (
                        typeof domNode.model === 'object' &&
                        domNode.model !== null
                    )
                        Tools.extend(
                            true,
                            this.resolvedConfiguration.model[name],
                            Tools.extend(
                                true,
                                {},
                                domNode.model,
                                this.resolvedConfiguration.model[name]
                            )
                        )
                    domNode.model = this.resolvedConfiguration.model[name]
                    if (domNode.model.hasOwnProperty('value'))
                        domNode.value = domNode.model.value
                    delete missingInputs[name]
                    this.inputs[name] = domNode
                    if (
                        this.resolvedConfiguration.debug &&
                        this.resolvedConfiguration.model[name].showIfExpression
                    )
                        domNode.setAttribute(
                            'title',
                            this.resolvedConfiguration.model[name]
                                .showIfExpression as string
                        )
                } else if (name.includes('.')) {
                    // Found input is a computable field.
                    this.resolvedConfiguration.model[name] = {
                        /*
                            NOTE: Will depend on all other available model
                            names.
                        */
                        dependsOn: null,
                        dynamicExtendExpressions: {value: name},
                        showIfExpression: name,
                        value: null
                    }
                    domNode.model = this.resolvedConfiguration.model[name]
                    this.inputs[name] = domNode
                } else if (dummyMode) {
                    // Nothing is specific specified: Prototyping mode.
                    this.resolvedConfiguration.model[name] = {
                        /*
                            NOTE: Will depend on all other available model
                            names.
                        */
                        dependsOn: null,
                        name,
                        value: null,
                        ...domNode.model
                    }
                    domNode.model = this.resolvedConfiguration.model[name]
                    this.inputs[name] = domNode
                } else
                    // Specification exists but found input isn't found there.
                    this.message =
                        `Given input "${name}" not found in current ` +
                        'configuration. Expected names are: "' +
                        `${this.modelNames.join('", "')}".`

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
        for (const name in this.resolvedConfiguration.model)
            if (
                this.resolvedConfiguration.model[name]
                    .hasOwnProperty('dependsOn') &&
                this.resolvedConfiguration.model[name].dependsOn === null
            ) {
                this.resolvedConfiguration.model[name].dependsOn =
                    this.modelNames
                this.preCompileShowIfExpression(name)
                this.preCompileDynamicExtendStructure(name)
            }
        return missingInputs
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
                                this.initialResponse,
                                this.latestResponse,
                                this.pending,
                                this.response,
                                this.onceSubmitted,
                                Tools,
                                ...this.evaluateExpressions(),
                                ...this.modelNames.map((name:string):any =>
                                    this.resolvedConfiguration.model[name]
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
                if (this.resolvedConfiguration.model[name].dependsOn)
                    for (
                        const dependentName of
                            this.resolvedConfiguration.model[name].dependsOn as
                                Array<string>
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
        if (this.resolvedConfiguration.model[name].transformerExpression) {
            const code:string =
                this.resolvedConfiguration.model[name].transformerExpression as
                    string
            const [scopeNames, preCompiled] = Tools.stringCompile(
                code,
                this.self.baseScopeNames.concat(
                    'self',
                    'value',
                    this.resolvedConfiguration.expressions.map(
                        (expression:Array<string>):string => expression[0]
                    ),
                    this.resolvedConfiguration.model[name].dependsOn || []
                )
            )
            if (typeof preCompiled === 'string')
                console.error(
                    `Failed to compile "transformerExpression" "${name}":`,
                    preCompiled
                )
            this.resolvedConfiguration.model[name].transformer = (
                value:any
            ):any => {
                if ([null, undefined].includes(value))
                    return value
                try {
                    return (preCompiled as Function)(
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.onceSubmitted,
                        Tools,
                        this.resolvedConfiguration.model[name],
                        value,
                        ...this.evaluateExpressions(),
                        ...(
                            this.resolvedConfiguration.model[name].dependsOn ||
                            []
                        ).map((name:string):any =>
                            this.resolvedConfiguration.model[name]
                        )
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
        if (this.resolvedConfiguration.model[name].showIfExpression) {
            const code:string =
                this.resolvedConfiguration.model[name].showIfExpression as
                    string
            const [scopeNames, preCompiled] = Tools.stringCompile(
                code,
                this.self.baseScopeNames.concat(
                    'self',
                    this.resolvedConfiguration.expressions.map(
                        (expression:Array<string>):string => expression[0]
                    ),
                    this.resolvedConfiguration.model[name].dependsOn || []
                )
            )
            if (typeof preCompiled === 'string')
                console.error(
                    `Failed to compile "showIf" expression "${name}":`,
                    preCompiled
                )
            this.resolvedConfiguration.model[name].showIf = ():boolean => {
                try {
                    return Boolean((preCompiled as Function)(
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.onceSubmitted,
                        Tools,
                        this.resolvedConfiguration.model[name],
                        ...this.evaluateExpressions(),
                        ...(
                            this.resolvedConfiguration.model[name].dependsOn ||
                            []
                        ).map((name:string):any =>
                            this.resolvedConfiguration.model[name]
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
        if (!this.resolvedConfiguration.model[name].dynamicExtendExpressions)
            return
        this.resolvedConfiguration.model[name].dynamicExtend = {}
        for (const subName in
            this.resolvedConfiguration.model[name].dynamicExtendExpressions
        )
            if ((
                this.resolvedConfiguration.model[name]
                    .dynamicExtendExpressions as Mapping
            ).hasOwnProperty(subName)) {
                const code:string = (
                    this.resolvedConfiguration.model[name]
                        .dynamicExtendExpressions as Mapping
                )[subName]
                const [scopeNames, preCompiled] = Tools.stringCompile(
                    code,
                    this.self.baseScopeNames.concat(
                        'self',
                        this.resolvedConfiguration.expressions.map(
                            (expression:Array<string>):string => expression[0]
                        ),
                        this.resolvedConfiguration.model[name].dependsOn || []
                    )
                )
                if (typeof preCompiled === 'string')
                    console.error(
                        `Failed to compile "dynamicExtendExpression" for ` +
                        `property "${subName}" in field "${name}":`,
                        preCompiled
                    );
                (
                    this.resolvedConfiguration.model[name].dynamicExtend as
                        Mapping<() => any>
                )[subName] = ():any => {
                    try {
                        return (preCompiled as Function)(
                            this.initialResponse,
                            this.latestResponse,
                            this.pending,
                            this.response,
                            this.onceSubmitted,
                            Tools,
                            this.resolvedConfiguration.model[name],
                            ...this.evaluateExpressions(),
                            ...(
                                this.resolvedConfiguration.model[name]
                                    .dependsOn ||
                                []
                            ).map((name:string):any =>
                                this.resolvedConfiguration.model[name])
                        )
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
                            this.initialResponse,
                            this.latestResponse,
                            this.pending,
                            this.response,
                            this.onceSubmitted,
                            Tools,
                            ...this.evaluateExpressions(),
                            ...this.modelNames.map((name:string):any =>
                                this.resolvedConfiguration.model[name]
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
                        this.initialResponse,
                        this.latestResponse,
                        this.pending,
                        this.response,
                        this.onceSubmitted,
                        Tools,
                        ...this.evaluateExpressions(name),
                        ...this.modelNames.map((name:string):any =>
                            this.resolvedConfiguration.model[name]
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
        for (const name in this.resolvedConfiguration.model)
            if (this.resolvedConfiguration.model.hasOwnProperty(name)) {
                this.resolvedConfiguration.model[name].dependsOn = (
                    [] as Array<string>
                ).concat(
                    this.resolvedConfiguration.model[name].dependsOn || []
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
            if (
                this.resolvedConfiguration.initializeTarget &&
                this.resolvedConfiguration.initializeTarget.url
            ) {
                const target:TargetConfiguration =
                    Tools.evaluateDynamicData(
                        Tools.copy(this.resolvedConfiguration.initializeTarget),
                        {Tools, ...this.resolvedConfiguration}
                    )
                await this.startBackgroundProcess()
                this.initialResponse = this.latestResponse =
                    await this.doRequest(target)
                if (!this.initialResponse) {
                    await this.stopBackgroundProcess()
                    return
                }
            }
            const target:null|string = this.resolveAction(
                this.resolvedConfiguration.actions.initialize, 'initialize'
            )
            if (typeof target === 'string')
                location.href = target
            else if (this.pending)
                await this.stopBackgroundProcess()
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
     * @returns Nothing.
     */
    clear(event:MouseEvent):void {
        this.reset(event, false)
    }
    /**
     * Sets all given input fields to their initial value.
     * @param event - Triggered event object.
     * @param useDefault - Indicates to use default value while reseting.
     * @returns Nothing.
     */
    reset(event:MouseEvent, useDefault:boolean = true):void {
        for (const name in this.inputs)
            this.resetInput(name, useDefault)
        event.preventDefault()
    }
    /**
     * Sets given input field their initial value.
     * @param name - Name of the field to clear.
     * @param useDefault - Indicates to use default value while reseting.
     * @returns A boolean indicating whether provided field name exists.
     */
    resetInput(name:string, useDefault:boolean = true):boolean {
        if (
            this.inputs.hasOwnProperty(name) &&
            this.resolvedConfiguration.model.hasOwnProperty(name)
        ) {
            if (
                useDefault &&
                this.resolvedConfiguration.model[name].hasOwnProperty(
                    'default'
                )
            )
                this.inputs[name].value =
                this.inputs[name].model.value =
                    this.resolvedConfiguration.model[name].default
            else
                this.inputs[name].value =
                this.inputs[name].model.value =
                    null
            return true
        }
        return false
    }
    /**
     * Sets all hidden non persistent input fields to their initial value.
     * @returns Nothing.
     */
    resetAllHiddenNonPersistentInputs():void {
        for (const name in this.inputs)
            if (
                this.inputs.hasOwnProperty(name) &&
                this.resolvedConfiguration.model.hasOwnProperty(name) &&
                !this.resolvedConfiguration.model[name].shown &&
                this.resolvedConfiguration.model[name].valuePersistence !==
                    'persistent'
            )
                this.resetInput(name)
    }
    /**
     * Retrieves current raw data from given input fields and retrieves invalid
     * fields.
     * @returns An object containing raw data and a list of invalid input
     * fields.
     */
    getData():ResponseResult {
        const data:PlainObject = {}
        const invalidInputNames:Array<string> = []
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name) && !name.includes('.')) {
                const value:any =
                    this.resolvedConfiguration.model[name].transformer ?
                        (this.resolvedConfiguration.model[name].transformer as
                            (value:any) => any
                        )(this.inputs[name].value) :
                        this.inputs[name].value
                if (
                    this.resolvedConfiguration.model[name].shown &&
                    // TODO validation state not set if disabled (not nullable).
                    Boolean(this.inputs[name].invalid)
                )
                    invalidInputNames.push(name)
                if (name && ![null, undefined].includes(value))
                    if (
                        typeof value === 'object' &&
                        this.resolvedConfiguration.model[name].hasOwnProperty(
                            'dataMapping'
                        )
                    ) {
                        if (
                            typeof this.resolvedConfiguration.model[name]
                                .dataMapping === 'string'
                        ) {
                            const evaluated:EvaluationResult =
                                Tools.stringEvaluate(
                                    this.resolvedConfiguration.model[name]
                                        .dataMapping as string,
                                    {item: value}
                                )
                            if (evaluated.error)
                                throw new Error(evaluated.error)
                            data[name] = evaluated.result
                        } else
                            for (const subName in (
                                this.resolvedConfiguration.model[name]
                                    .dataMapping as Mapping
                            ))
                                if ((
                                    this.resolvedConfiguration.model[name]
                                        .dataMapping as Mapping
                                ).hasOwnProperty(subName))
                                    data[subName] = value[(
                                        this.resolvedConfiguration.model[
                                            name
                                        ].dataMapping as Mapping
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
        this.message =
            'The following inputs are invalid "' +
            `${invalidInputNames.join('", "')}".`
        this.updateMessageBox()
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
            event: 'jobRadFormSubmitSuccessful',
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
                event: 'jobRadFormServerEMailAddressInvalid',
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
                event: 'jobRadFormServerAuthenticationInvalid',
                eventType: 'serverAuthenticationInvalid',
                label: 'serverAuthenticationInvalid',
                reference: {
                    request: rawData,
                    response: response.data
                }
            })
        else if (response && response.status === 420)
            // NOTE: We have an invalid re-captcha.
            this.track({
                event: 'jobRadFormReCaptchaCheckFailed',
                eventType: 'serverReCaptchaCheckFailed',
                label: 'serverReCaptchaCheckFailed',
                reference: {
                    request: rawData,
                    response: response.data
                }
            })
        else if (response && response.status === 428)
            // NOTE: We have sent an outdated form.
            this.track({
                event: 'jobRadFormServerFormOutdated',
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
                event: 'jobRadFormServerUnexpected',
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
        const promises:Array<Promise<void>> = []
        try {
            // Sent data to server and update re-captcha token in parallel.
            promises.push(fetch(target.url, target.options || {}).then(
                (response:Response):void => {
                    result = response
                }
            ))
            promises.push(this.updateReCaptchaToken())
            await Promise.all(promises)
            let responseString:string = await (result as Response).text()
            if (responseString.startsWith(
                this.resolvedConfiguration.securityResponsePrefix
            ))
                responseString = responseString.substring(
                    this.resolvedConfiguration.securityResponsePrefix.length
                );
            (result as Response).data = JSON.parse(responseString);
            (result as Response).data = Tools.getSubstructure(
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
                        event: 'jobRadFormServerAuthenticationInvalid',
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
     * @param data - Valid data given by the form.
     * @param newWindow - Indicates whether action targets should be opened
     * in a new window.
     * @returns Promise holding nothing.
     */
    async handleValidSubmittedInput(
        data:PlainObject, newWindow:boolean = false
    ):Promise<void> {
        this.message = 'Sende Daten...'
        if (this.resolvedConfiguration.target && this.resolvedConfiguration.target.url) {
            // region prepare request
            this.resolvedConfiguration.data = data
            this.resolvedConfiguration.targetData = this.mapTargetNames(data)
            const target:TargetConfiguration = Tools.evaluateDynamicData(
                Tools.copy(this.resolvedConfiguration.target),
                {
                    determineStateURL: this.determineStateURL.bind(this),
                    Tools,
                    ...this.resolvedConfiguration
                }
            )
            if (target.options.body && typeof target.options.body !== 'string')
                target.options.body = JSON.stringify(target.options.body)
            // endregion
            this.track({
                event: 'jobRadFormSubmit',
                eventType: 'formSubmit',
                label: 'formSubmit',
                reference: data,
                userInteraction: true,
                value: this.resolvedConfiguration.conversionValue.submit
            })
            this.latestResponse = this.response = null
            await this.startBackgroundProcess()
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
            await this.stopBackgroundProcess()
        } else {
            await this.startBackgroundProcess()
            if (this.resolvedConfiguration.debug)
                console.debug('Retrieved data:', Tools.represent(data))
            await this.stopBackgroundProcess()
        }
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
                    this.resolvedConfiguration.model.hasOwnProperty(name) &&
                    this.resolvedConfiguration.model[name]
                        .hasOwnProperty('target')
                ) {
                    if (
                        typeof this.resolvedConfiguration.model[name].target ===
                            'string' &&
                        (this.resolvedConfiguration.model[name].target as
                            string
                        ).length
                    )
                        result[
                            this.resolvedConfiguration.model[name].target as
                                keyof PlainObject
                        ] = data[name]
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
    async submit(event:KeyboardEvent|MouseEvent):Promise<void> {
        try {
            event.preventDefault()
            if (this.submitted || this.pending)
                return
            const target:HTMLElement|null = this.submitButtons.length ?
                this.submitButtons[0] :
                event.target as HTMLElement
            const newWindow:boolean = target ?
                target.getAttribute('target') === '_blank' :
                false
            this.setAttribute('submitted', '')
            this.resolvedConfiguration.reCaptcha.token =
                this.self.reCaptchaToken

            this.resetAllHiddenNonPersistentInputs()
            const {data, invalidInputNames} = this.getData()
            if (invalidInputNames.length) {
                // Trigger input components to present their validation state.
                for (const name in this.inputs)
                    if (this.inputs.hasOwnProperty(name))
                        this.inputs[name].showInitialValidationState = true
                this.handleInvalidSubmittedInput(data, invalidInputNames)
            } else {
                this.onceSubmitted = this.submitted = true
                let valid: boolean = true
                const fieldValues:Array<any> =
                    this.modelNames.map((name:string):any =>
                        this.resolvedConfiguration.model[name]
                    )
                const values:Array<any> = [
                    this.initialResponse,
                    this.latestResponse,
                    this.pending,
                    this.response,
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
                        this.message = constraint.description
                        valid = false
                        break
                    }
                }
                if (valid)
                    await this.handleValidSubmittedInput(data, newWindow)
                else {
                    this.track({
                        event: 'jobRadFormInputInvalid',
                        eventType: 'inputInvalid',
                        label: 'inputInvalid',
                        reference: data
                    })
                    this.updateMessageBox()
                }
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
                        this.resolvedConfiguration.model[name].hasOwnProperty(
                            'eventChangedName'
                        ) ?
                            this.resolvedConfiguration.model[name].eventChangedName :
                            'modelChange'
                    ),
                    async ():Promise<void> => {
                        await this.updateInputDependencies(name)
                        this.updateAllGroups()
                    }
                )
    }
    /**
     * Add all input mode value synchronizing event listener callbacks.
     * @returns Nothing.
     */
    addEventValueUpdateListener():void {
        for (const name in this.inputs)
            if (
                this.inputs.hasOwnProperty(name) &&
                this.resolvedConfiguration.model[name].hasOwnProperty(
                    'eventChangedName'
                )
            )
                Object.defineProperty(
                    this.resolvedConfiguration.model[name],
                    'value',
                    {
                        get: ():any => this.inputs[name].value,
                        set: (value:any):void => {
                            this.inputs[name].value = value
                        }
                    }
                )
    }
    /**
     * Updates all fields.
     * @returns Promise holding nothing.
     */
    async updateAllInputs():Promise<void> {
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name))
                await this.updateInput(name)
    }
    /**
     * Updates given input (by name) dynamic expression and its visibility
     * state.
     * @param name - Field name to update.
     * @returns A Promise resolving to a boolean indicator whether a state
     * changed happened or not.
     */
    async updateInput(name:string):Promise<boolean> {
        // We have to check for real state changes to avoid endless loops.
        let changed:boolean = false
        if (this.resolvedConfiguration.model[name].hasOwnProperty(
            'dynamicExtend'
        ))
            for (
                const key in
                    this.resolvedConfiguration.model[name].dynamicExtend
            ) {
                const oldValue:any =
                    this.resolvedConfiguration.model[name][key]
                const newValue:any =
                    this.resolvedConfiguration.model[name].dynamicExtend[key]()
                if (oldValue !== newValue) {
                    changed = true
                    this.resolvedConfiguration.model[name][key] = newValue
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
                }
            }
        if (this.updateInputVisibility(name) || changed) {
            this.triggerModelUpdate(name)
            /*
                NOTE: We should wait a digest loop to ensure all projected
                components have been initialized.
            */
            await Tools.timeout()
            await this.updateInputDependencies(name)
        }
        return changed
    }
    /**
     * Updates all field dependencies.
     * @returns Promise holding nothing.
     */
    async updateAllInputDependencies():Promise<void> {
        for (const name in this.inputs)
            if (this.inputs.hasOwnProperty(name))
                await this.updateInputDependencies(name)
    }
    /**
     * Updates all related fields for given field name.
     * @param name - Field to check their dependent fields.
     * @returns Promise holding nothing.
     */
    async updateInputDependencies(name:string):Promise<void> {
        for (const dependentName of this.dependencyMapping[name])
            await this.updateInput(dependentName)
    }
    /**
     * Trigger inputs internal change detection.
     * @param name - Field name to update their model.
     * @returns Nothing.
     */
    triggerModelUpdate(name:string):void {
        if (this.inputs.hasOwnProperty(name)) {
            if ('changeTrigger' in this.inputs[name])
                this.inputs[name].changeTrigger =
                    !this.inputs[name].changeTrigger
        } else
            console.warn(
                `Input node (to update corresponding model) for "${name}" ` +
                'not found.'
            )
    }
    // / endregion
    // / region utility
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
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async startBackgroundProcess():Promise<void> {
        this.showSpinner()
        this.pending = true
        await this.updateAllInputs()
        this.updateAllGroups()
    }
    /**
     * Stops indicating a background running process. Sets "pending" property
     * and stop showing a loading spinner.
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async stopBackgroundProcess():Promise<void> {
        this.pending = false
        await this.updateAllInputs()
        this.updateAllGroups()
        this.hideSpinner()
    }
    /**
     * Determines current state url.
     * @returns URL.
     */
    determineStateURL():{encoded:string;plain:string} {
        let parameter:PlainObject = {
            model: {},
            ...(this.urlConfiguration || {})
        }
        for (const name in this.resolvedConfiguration.model)
            if (
                this.resolvedConfiguration.model.hasOwnProperty(name) &&
                (
                    this.resolvedConfiguration.model[name].state &&
                    this.resolvedConfiguration.model[name].state.dirty ||
                    // TODO Workaround until state is support by crefo input.
                    name === 'crefo' &&
                    // TODO should use new "?..." syntax when supported.
                    this.resolvedConfiguration.model.crefo.value &&
                    this.resolvedConfiguration.model.crefo.value.crefonummer
                ) &&
                /*
                    NOTE: If only a boolean value and two possible states
                    possible we do not have to save an implicit default
                    "false".
                */
                !(
                    !this.resolvedConfiguration.model[name].value &&
                    !this.resolvedConfiguration.model[name].default &&
                    this.resolvedConfiguration.model[name].type === 'boolean' &&
                    !(
                        this.resolvedConfiguration.model[name].selection &&
                        Array.isArray(
                            this.resolvedConfiguration.model[name].selection
                        ) &&
                        this.resolvedConfiguration.model[name].selection.length > 2 ||
                        this.resolvedConfiguration.model[name].selection &&
                        !Array.isArray(
                            this.resolvedConfiguration.model[name].selection
                        ) &&
                        Object.keys(
                            this.resolvedConfiguration.model[name].selection
                        ).length > 2
                    )
                )
            )
                if (parameter.model.hasOwnProperty(name)) {
                    if (
                        this.resolvedConfiguration.model[name].value !==
                            parameter.model[name].value
                    )
                        if (
                            this.resolvedConfiguration.model[name].value ===
                                this.resolvedConfiguration.model[name].default
                        ) {
                            delete parameter.model[name].value
                            if (Object.keys(parameter.model[name]) === 0)
                                delete parameter.model[name]
                        } else
                            parameter.model[name].value =
                                this.resolvedConfiguration.model[name].value
                } else if (
                    this.resolvedConfiguration.model[name].value !==
                        this.resolvedConfiguration.model[name].default
                )
                    parameter.model[name] = {
                        value: this.resolvedConfiguration.model[name].value
                    }
        parameter = this.maskObject(parameter, this.resolvedConfiguration.urlModelMask)
        if (Object.keys(parameter.model).length === 0)
            delete parameter.model
        let encodedURL:string = document.URL
        let url:string = document.URL
        if (Object.keys(parameter).length) {
            encodedURL = url = url.replace(/[?&]jForm=[^&]*/g, '')
            const value:string = JSON.stringify(parameter)
            const encodedQueryParameter:string =
                `jForm=${encodeURIComponent(value)}`
            const queryParameter:string = `jForm=${value}`
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
        if (Array.isArray(window.dataLayer))
            /*
                NOTE: We should forwarded runtime data to avoid unexpected
                behavior if gtm or configured tracking tool manipulates given
                data.
            */
            if (data.hasOwnProperty('reference'))
                data.reference = Tools.copy(data.reference)
            window.dataLayer.push({
                context: location.pathname,
                subject: 'jobRadForm',
                value: 0,
                userInteraction: false,
                ...data
            })
    }
    /**
     * Updates internal saved re-captcha token.
     * @returns Promise resolving to nothing.
     */
    async updateReCaptchaToken():Promise<void> {
        if (window.grecaptcha)
            try {
                this.self.reCaptchaToken = await new Promise((
                    resolve:Function, reject:Function
                ):void => window.grecaptcha!.ready(async ():Promise<void> =>
                    resolve(await window.grecaptcha.execute(
                        this.resolvedConfiguration.reCaptcha.key,
                        this.resolvedConfiguration.reCaptcha.options
                    ))
                ))
            } catch (error) {
                console.warn(
                    `Could not retrieve a re-captcha token: "` +
                    `${Tools.represent(error)}".`
                )
            }
        else
            await Tools.timeout()
    }
    // / endregion
    // endregion
}
// endregion
export const api:WebComponentAPI<AgileForm> = {
    component: AgileForm,
    register: (tagName:string = 'agile-form'):void =>
        customElements.define(name, AgileForm)
}
export default api
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
