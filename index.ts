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
import Tools, {Lock, $} from 'clientnode'
import {
    CompilationResult,
    EvaluationResult,
    Mapping,
    Offset,
    PlainObject,
    ProcedureFunction,
    QueryParameters,
    RecursiveEvaluateable,
    RecursivePartial,
    TemplateFunction,
    UnknownFunction
} from 'clientnode/type'
import {object} from 'clientnode/property-types'
import property from 'web-component-wrapper/decorator'
import Web from 'web-component-wrapper/Web'
import {WebComponentAPI, StaticWebComponent} from 'web-component-wrapper/type'

import {
    Action,
    AnnotatedDomNode,
    AnnotatedInputDomNode,
    Configuration,
    Constraint,
    Evaluation,
    Expression,
    FormResponse,
    GroupSpecification,
    IndicatorFunction,
    InputAnnotation,
    InputConfiguration,
    Model,
    NormalizedConfiguration,
    ResponseResult,
    StateURL,
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
 * @property static:knownPropertyOrdering - Order of known properties to
 * apply on inputs.
 *
 * @property clearButtons - Reference to form clear button nodes.
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
 * @property inputConfigurations - Mapping from field name to corresponding
 * configuration.
 * @property inputNames - Specified transformer environment variable names.

 * @property invalid - Indicates whether this form has invalid input.
 * @property invalidConstraint - Indicates whether which constraint or none if
 * none where determined as invalid.
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
 * @property reCaptchaPromiseResolver - Reference to re-captcha initialisation.
 * @property reCaptchaToken - Last challenge result token promise resolver.

 * @property additionalConfiguration - Holds given configuration object.
 * @property baseConfiguration - Holds given configuration object.
 * @property configuration - Holds given configuration object.
 * @property dynamicConfiguration - Holds given configuration object.
 * @property resolvedConfiguration - Holds given configuration object.
 * @property urlConfiguration - URL given configurations object.
 * @property queryParameters - All determined query parameters.
 *
 * @property lock - Holds lock instance for saving instance specific locks.
 *
 * @property _evaluationResults - Last known evaluation result cache.
 */
export class AgileForm<TElement = HTMLElement> extends Web<TElement> {
    // region properties
    static baseScopeNames:Array<string> = [
        'determineStateURL',
        'determinedTargetURL',
        'getData',
        'initialResponse',
        'invalid',
        'invalidConstraint',
        'latestResponse',
        'pending',
        'queryParameters',
        'response',
        'stateMessage',
        'submitted',
        'Tools',
        'valid'
    ]
    static content = '<form novalidate><slot></slot></form>'
    static defaultConfiguration:RecursiveEvaluateable<Configuration> = {
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
        inputs: {},
        name: 'aForm',
        offsetInPixel: 85,
        reCaptcha: {
            action: {
                action: 'aForm'
            },
            key: {
                v2: '',
                v3: ''
            },
            secret: '',
            skip: false,
            token: ''
        },
        responseDataWrapperSelector: {
            optional: true,
            path: 'data'
        },
        securityResponsePrefix: `)]}',`,
        selector: {
            clearButtons: 'button[clear]',
            groups: '.agile-form__group',
            // TODO support buttons (with two states).
            inputs: `
                button[name],

                file-input, generic-input, generic-inputs,
                requireable-checkbox, slider-input, input,

                select, textarea
            `.replace(/\n+/g, ' ').replace(/  +/g, ' '),
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
                body: {__evaluate__: 'targetData'} as
                    unknown as
                    TargetConfiguration['options']['body'],
                cache: 'no-cache',
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
        urlConfigurationMask: {
            exclude: false,
            include: {
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
        /*
            e.g.:

            nullable: {
                invert: true,
                name: 'required'
            }
        */
    }
    static knownPropertyOrdering:Array<string> = [
        'model',
        'name',
        'type',
        'maximum',
        'minimum',
        'maximumLength',
        'maximum-length',
        'minimumLength',
        'minimum-length',
        'pattern',
        'invertedPattern',
        'inverted-pattern',
        'emptyEqualsNull',
        'empty-equals-null',
        'required',
        'selection',
        'suggestionCreator',
        'suggestion-creator',
        'suggestSelection',
        'suggest-selection',
        'default',
        'initialValue'
    ]
    static _name = 'AgileForm'

    clearButtons:Array<AnnotatedDomNode> = []
    resetButtons:Array<AnnotatedDomNode> = []
    spinner:Array<AnnotatedDomNode> = []
    statusMessageBoxes:Array<AnnotatedDomNode> = []
    submitButtons:Array<AnnotatedDomNode> = []
    truncateButtons:Array<AnnotatedDomNode> = []

    dependencyMapping:Mapping<Array<string>> = {}

    evaluations:Array<Evaluation> = []

    groups:Array<[AnnotatedDomNode, GroupSpecification]> = []

    determinedTargetURL:null|string = null
    initialData:Mapping<unknown> = {}
    initialResponse:null|FormResponse = null
    latestResponse:null|FormResponse = null
    message = ''
    response:null|FormResponse = null

    inputEventBindings:Mapping<Function> = {}
    inputConfigurations:Mapping<InputConfiguration> = {}
    inputNames:Array<string> = []

    invalid:boolean|null = null
    invalidConstraint:Constraint|null = null
    onceSubmitted = false
    pending = true
    submitted = false
    valid:boolean|null = null

    reCaptchaFallbackInput:AnnotatedDomNode|null = null
    reCaptchaFallbackRendered = false
    /*
        NOTE: Will be finally initialized when promise is created so do not
        change order here.
    */
    reCaptchaPromiseResolver:(_result:null|string) => void =
        (_result:null|string) => {}
    reCaptchaPromise:Promise<null|string> = new Promise(
        (resolve:(_result:null|string) => void):void => {
            this.reCaptchaPromiseResolver = resolve
        }
    )
    reCaptchaToken:null|string = null

    @property({type: object})
        additionalConfiguration:RecursivePartial<Configuration>|undefined
    @property({type: object})
        baseConfiguration:RecursivePartial<Configuration>|undefined
    @property({type: object})
        configuration:RecursivePartial<Configuration>|undefined
    @property({type: object})
        dynamicConfiguration:RecursivePartial<Configuration>|undefined
    resolvedConfiguration:Configuration = {} as Configuration
    urlConfiguration:null|RecursivePartial<Configuration> = null
    queryParameters:QueryParameters

    readonly self:typeof AgileForm = AgileForm

    readonly lock:Lock = new Lock()

    _evaluationResults:Array<unknown> = []
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

        this.queryParameters = Tools.stringGetURLParameter() as QueryParameters

        this.resolveConfiguration()
    }
    /**
     * Parses given configuration object and delegates to forward them to
     * nested input nodes.
     * @param name - Attribute name which was updates.
     * @param oldValue - Old attribute value.
     * @param newValue - New updated value.
     *
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

        void this.updateReCaptchaToken()
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
            if (Object.prototype.hasOwnProperty.call(
                this.inputEventBindings, name
            ))
                this.inputEventBindings[name]()
    }
    /**
     * Triggered when content projected and nested dom nodes are ready to be
     * traversed. Selects all needed dom nodes.
     * @param reason - Description why rendering is necessary.
     *
     * @returns A promise resolving to nothing.
     */
    async render(reason = 'unknown'):Promise<void> {
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
                this.show(this.reCaptchaFallbackInput)
            else
                this.hide(this.reCaptchaFallbackInput)

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

        await this.initialize()
    }
    // endregion
    // region handle visibility states
    /**
     * Fades given dom node to given opacity.
     * @param domNode - Node to fade.
     * @param opacity - Opacity value between 0 and 1.
     * @param durationInMilliseconds - Duration of animation.
     *
     * @returns Nothing.
     */
    fade(
        domNode:AnnotatedDomNode, opacity = 1, durationInMilliseconds = 100
    ):void {
        if (domNode.clearFading)
            void domNode.clearFading()

        if (parseFloat(domNode.style.opacity) === opacity)
            return

        if (opacity === 0) {
            const style:Mapping<number|string> = $(domNode).Tools('style')

            domNode.oldDisplay = style.display as string || 'initial'
            if (domNode.oldDisplay === 'none')
                delete domNode.oldDisplay

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

            let currentOpacity:number =
                domNode.oldOpacity =
                parseFloat(style.opacity as string)
            const timer = setInterval(
                ():void => {
                    if (currentOpacity <= opacity + .1) {
                        if (domNode.clearFading)
                            void domNode.clearFading()
                        return
                    }

                    currentOpacity -= currentOpacity * .1
                    domNode.style.opacity = `${currentOpacity}`
                },
                durationInMilliseconds * .1
            )

            domNode.clearFading = ():void => {
                clearInterval(timer)
                domNode.style.opacity = `${opacity}`
                domNode.style.display = 'none'
                domNode.style.position = oldPosition
                delete domNode.clearFading
            }
        } else {
            domNode.style.display = domNode.oldDisplay || 'block'

            if (!this.resolvedConfiguration.animation) {
                domNode.style.opacity = '1'
                return
            }

            let currentOpacity = .1
            const timer = setInterval(
                ():void => {
                    if (currentOpacity >= (domNode.oldOpacity || 1) - .1) {
                        if (domNode.clearFading)
                            void domNode.clearFading()

                        return
                    }

                    currentOpacity *= 1.1
                    domNode.style.opacity = `${currentOpacity}`
                },
                durationInMilliseconds * .1
            )

            domNode.clearFading = ():void => {
                clearInterval(timer)

                domNode.style.opacity = `${domNode.oldOpacity || 1}`

                delete domNode.clearFading
            }
        }
    }
    /**
     * Adds given dom nodes visual representation.
     * @param domNode - Node to show.
     *
     * @returns Nothing.
     */
    show(domNode:AnnotatedDomNode):void {
        this.fade(domNode)
    }
    /**
     * Removes given dom nodes visual representation.
     * @param domNode - Node to hide.
     *
     * @returns Nothing.
     */
    hide(domNode:AnnotatedDomNode):void {
        this.fade(domNode, 0)
    }
    /**
     * Shows the spinner.
     * @returns Nothing.
     */
    showSpinner():void {
        if (this.spinner.length) {
            for (const domNode of this.spinner)
                this.show(domNode)

            void this.scrollAndFocus(this.spinner[0])
        }
    }
    /**
     * Hides the spinner.
     * @returns Nothing.
     */
    hideSpinner():void {
        for (const domNode of this.spinner)
            this.hide(domNode)
    }
    /**
     * Updates given field (by name) visibility state.
     * @param name - Field name to update.
     *
     * @returns A promise resolving to a boolean value indicating whether a
     * visibility change has been happen.
     */
    async updateInputVisibility(name:string):Promise<boolean> {
        const inputConfiguration:InputConfiguration =
            this.inputConfigurations[name]

        const oldState:boolean|undefined = inputConfiguration.shown

        inputConfiguration.shown =
            !inputConfiguration.showIf || Boolean(inputConfiguration.showIf())
        for (const domNode of this.inputConfigurations[name].domNodes)
            domNode.shown = inputConfiguration.shown

        if (inputConfiguration.shown !== oldState) {
            if (this.resolvedConfiguration.debug)
                if (Boolean(oldState) === oldState)
                    console.debug(
                        `Update input "${name}" visibility state from ` +
                        `"${oldState ? 'show' : 'hide'}" to "` +
                        `${inputConfiguration.shown ? 'show' : 'hide'}".`
                    )
                else
                    console.debug(
                        `Initialize input "${name}" visibility state to "` +
                        `${inputConfiguration.shown ? 'show' : 'hide'}".`
                    )

            if (inputConfiguration.shown || this.resolvedConfiguration.showAll)
                for (const domNode of this.inputConfigurations[name].domNodes)
                    this.show(domNode)
            else {
                if (inputConfiguration.valuePersistence === 'resetOnHide')
                    await this.resetInput(name)

                for (const domNode of this.inputConfigurations[name].domNodes)
                    this.hide(domNode)
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
        for (const [domNode, specification] of this.groups) {
            const name:string =
                domNode.getAttribute('name') ??
                domNode.getAttribute('data-name') ??
                'unknown'
            const oldState:boolean|null = domNode.shown

            const shownSubNodes:Array<AnnotatedDomNode> = (
                specification.childs.filter((
                    node:AnnotatedDomNode
                ):boolean => node.shown)
            )

            specification.showReason = null
            if (specification.showIf) {
                if (specification.showIf(shownSubNodes, specification.childs))
                    specification.showReason = specification.showIfExpression
            } else if (
                shownSubNodes.length || specification.childs.length === 0
            )
                specification.showReason = shownSubNodes

            domNode.shown = Boolean(specification.showReason)

            if (domNode.shown === oldState) {
                /*
                console.debug(
                    `Group "${name}" stays in visibility state "` +
                    `${oldState ? 'show' : 'hide'}".`
                )
                */
                if (domNode.shown)
                    this.updateGroupContent(domNode)

                continue
            }

            if (this.resolvedConfiguration.debug)
                if (Boolean(oldState) === oldState)
                    console.debug(
                        `Update group "${name}" visibility state from "` +
                        `${oldState ? 'show' : 'hide'}" to "` +
                        `${domNode.shown ? 'show' : 'hide'}".`
                    )
                else
                    console.debug(
                        `Initialize group "${name}" visibility state to "` +
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
        }
    }
    /**
     * Evaluate dynamic text content.
     * @param domNode - Dom node to render its content.
     *
     * @returns Nothing.
     */
    updateGroupContent(domNode:AnnotatedDomNode):void {
        const scope:Mapping<unknown> = {}
        const keys:Array<string> = this.self.baseScopeNames.concat(
            this.evaluations.map(
                (evaluation:Evaluation):string => evaluation[0]
            ),
            this.inputNames
        )

        const values:Array<unknown> = [
            this.determineStateURL,
            this.determinedTargetURL,
            this.getData,
            this.initialResponse,
            this.invalid,
            this.invalidConstraint,
            this.latestResponse,
            this.pending,
            this.queryParameters,
            this.response,
            this.message,
            this.onceSubmitted,
            Tools,
            this.valid,
            ...this._evaluationResults,
            ...this.inputNames.map((name:string):InputConfiguration =>
                this.inputConfigurations[name]
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
                        NOTE: Avoid updating nested grouped nodes which are
                        managed by their group component.
                    */
                    !(
                        domNode.matches &&
                        (
                            domNode.matches(
                                this.resolvedConfiguration.selector.groups
                            ) ||
                            domNode.matches(
                                this.resolvedConfiguration.selector.inputs
                            )
                        )
                    ),
                ignoreComponents: false
            }
        )
    }
    /**
     * Updates current error message box state.
     * @param message - New message string to show.
     *
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
     * Normalizes given url configuration to support deprecated formats.
     * 1. Alias top level configuration key "model" to "inputs".
     * 2. Respect top level property configuration (not having nested
     *    "properties" key in input configuration).
     * 3. Alias top level input property configuration "mutable" and "writable"
     *    into properties top level inverted "disabled" configuration.
     * 4. Alias top level input property configuration "nullable" into
     *    properties top level inverted "required" configuration.
     * @param configuration - Configuration object to normalize.
     *
     * @returns Normalized configuration.
     */
    static normalizeURLConfiguration(
        configuration:PlainObject
    ):RecursivePartial<Configuration> {
        const currentConfiguration:PlainObject = Tools.copy(configuration)

        // Consolidate aliases for "input" configuration item.
        const inputs:Mapping<RecursivePartial<InputConfiguration>> =
            currentConfiguration.inputs as
                Mapping<RecursivePartial<InputConfiguration>> ||
            {}
        if (currentConfiguration.model) {
            Tools.extend(
                true,
                inputs,
                currentConfiguration.model as
                    Mapping<RecursivePartial<InputConfiguration>>
            )

            delete currentConfiguration.model
        }

        /*
            Normalize deprecated top level input configurations into
            "properties" configuration.
        */
        for (const input of Object.values(inputs)) {
            if (!input.properties)
                input.properties = {}

            for (const key of ['selection', 'value'] as const)
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    /* eslint-disable @typescript-eslint/no-extra-semi */
                    ;(input.properties as InputAnnotation)[
                        key as 'value'
                    ] = (input as InputAnnotation)[key as 'value']
                    /* eslint-enable @typescript-eslint/no-extra-semi */

                    delete (input as {
                        selection?:unknown
                        value?:unknown
                    })[key]
                }

            if (Object.prototype.hasOwnProperty.call(input, 'nullable')) {
                // eslint-disable-next-line @typescript-eslint/no-extra-semi
                ;(input.properties as InputAnnotation).required =
                    !(input as {nullable?:boolean}).nullable

                delete (input as {nullable?:boolean}).nullable
            }

            for (const key of ['mutable', 'writable'] as const)
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    /* eslint-disable @typescript-eslint/no-extra-semi */
                    ;(input.properties as InputAnnotation)
                        .disabled = !(input as {
                            mutable?:boolean
                            writable?:boolean
                        })[key]
                    /* eslint-enable @typescript-eslint/no-extra-semi */

                    delete (input as {
                        mutable?:boolean
                        writable?:boolean
                    })[key]
                }
        }

        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(currentConfiguration as
            unknown as
            {inputs:Mapping<RecursivePartial<InputConfiguration<unknown>>>}
        ).inputs = inputs

        return currentConfiguration as RecursivePartial<Configuration>
    }
    /**
     * Normalizes given configuration.
     * @param configuration - Configuration object to normalize.
     *
     * @returns Normalized configuration.
     */
    static normalizeConfiguration(
        configuration:RecursivePartial<Configuration>
    ):NormalizedConfiguration {
        const currentConfiguration:RecursivePartial<Configuration> =
            Tools.copy(configuration)

        currentConfiguration.evaluations = ([] as Array<Evaluation>).concat(
            currentConfiguration.evaluations as unknown as Array<Evaluation> ||
            []
        )
        currentConfiguration.expressions = ([] as Array<Expression>).concat(
            currentConfiguration.expressions as unknown as Array<Expression> ||
            []
        )

        if (!currentConfiguration.tag)
            currentConfiguration.tag = {values: []}
        if (!currentConfiguration.tag.values)
            currentConfiguration.tag.values = []
        currentConfiguration.tag.values = ([] as Array<string>).concat(
            currentConfiguration.tag.values as Array<string>|string
        )

        // NOTE: We migrate alternate tag option formats.
        if (Object.prototype.hasOwnProperty.call(
            currentConfiguration, 'tags'
        )) {
            currentConfiguration.tag.values =
                currentConfiguration.tag.values.concat((
                    currentConfiguration as unknown as {tags:Array<string>}
                ).tags)

            delete currentConfiguration.tags
        }

        return currentConfiguration as NormalizedConfiguration
    }
    /**
     * Merge given configuration into resolved configuration object.
     * @param configuration - Configuration to merge.
     *
     * @return Nothing.
     */
    mergeConfiguration(configuration:RecursivePartial<Configuration>):void {
        const normalizedConfiguration:NormalizedConfiguration =
            this.self.normalizeConfiguration(configuration)

        // Merge evaluations and expressions.
        normalizedConfiguration.evaluations =
            this.resolvedConfiguration.evaluations
                .concat(normalizedConfiguration.evaluations)
        normalizedConfiguration.expressions =
            this.resolvedConfiguration.expressions
                .concat(normalizedConfiguration.expressions)

        Tools.extend(
            true,
            this.resolvedConfiguration,
            normalizedConfiguration as RecursivePartial<Configuration>
        )
    }
    /**
     * Resolve and merges configuration sources into final object.
     * @returns Nothing.
     */
    resolveConfiguration():void {
        this.resolvedConfiguration = this.self.normalizeConfiguration(
            this.self.defaultConfiguration as RecursivePartial<Configuration>
        ) as Configuration

        for (let configuration of [
            this.baseConfiguration,
            this.configuration,
            this.dynamicConfiguration,
            this.additionalConfiguration
        ])
            if (configuration)
                this.mergeConfiguration(configuration)
        /*
            NOTE: We have to determine url parameter after resolving
            configuration to have the final url mask available.
        */
        this.urlConfiguration = this.getConfigurationFromURL()

        if (this.urlConfiguration)
            this.mergeConfiguration(this.urlConfiguration)

        this.resolvedConfiguration.initializeTarget =
            Tools.extend<TargetConfiguration>(
                true,
                Tools.copy<TargetConfiguration>(
                    this.resolvedConfiguration.target as TargetConfiguration
                ),
                this.resolvedConfiguration.initializeTarget
            )

        if (this.resolvedConfiguration.debug)
            console.debug(
                'Got configuration:',
                Tools.represent(this.resolvedConfiguration)
            )
    }
    /**
     * Determines configuration by existing url parameter.
     * @returns Nothing.
     */
    getConfigurationFromURL():null|RecursivePartial<Configuration> {
        const parameter:Array<string>|string|undefined =
            this.queryParameters[this.resolvedConfiguration.name]
        if (typeof parameter === 'string') {
            const evaluated:EvaluationResult = Tools.stringEvaluate(parameter)

            if (evaluated.error) {
                console.warn(
                    'Error occurred during processing given url parameter "' +
                    `${this.resolvedConfiguration.name}": ${evaluated.error}`
                )

                return null
            }

            if (
                evaluated.result !== null &&
                typeof evaluated.result === 'object'
            )
                return Tools.mask<RecursivePartial<Configuration>>(
                    this.self.normalizeURLConfiguration(evaluated.result),
                    this.resolvedConfiguration.urlConfigurationMask
                ) as RecursivePartial<Configuration>
        }

        return null
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
        await this.lock.acquire(lockName)

        const missingInputs:Mapping<InputConfiguration> =
            await this.connectSpecificationWithDomNodes()

        // Configure input components to hide validation states first.
        for (const {domNodes} of Object.values(this.inputConfigurations))
            for (const domNode of domNodes)
                domNode.showInitialValidationState = false

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

        await this.lock.release(lockName)
    }
    /**
     * Determine all environment variables to ran expressions again. We have to
     * do this a second time to include dynamically added inputs in prototyping
     * mode.
     * @returns Nothing.
     */
    determineInputNames():void {
        this.inputNames = Object.keys(this.inputConfigurations)
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
    async connectSpecificationWithDomNodes():Promise<Mapping<
        InputConfiguration
    >> {
        const inputCandidates:Array<AnnotatedInputDomNode> =
            Array.from(this.root.querySelectorAll(
                this.resolvedConfiguration.selector.inputs
            ))

        const inputs:Array<AnnotatedInputDomNode> = inputCandidates.filter((
            domNode:AnnotatedDomNode
        ):boolean =>
            !inputCandidates.some((
                otherDomNode:AnnotatedInputDomNode
            ):boolean =>
                domNode !== otherDomNode && otherDomNode.contains(domNode)
            )
        )

        // If no input is specified simply consider all provided inputs.
        const dummyMode:boolean =
            Object.keys(this.resolvedConfiguration.inputs).length === 0
        // Show all inputs in dummy mode.
        if (dummyMode)
            for (const domNode of inputs)
                this.show(domNode)

        this.inputConfigurations = {}
        for (const [name, configuration] of Object.entries(
            this.resolvedConfiguration.inputs
        ))
            this.inputConfigurations[name] = {
                domNodes: [],
                name,
                properties: {},
                ...configuration as
                    Omit<InputConfiguration, 'domNodes'|'name'|'properties'>
            }

        const missingInputs:Mapping<InputConfiguration> =
            {...this.inputConfigurations}

        this.determineInputNames()
        this.initialData = {}

        let index:number = 0
        /*
            Match all found inputs against existing specified fields or load
            not specified input into the specification (model configuration).
        */
        for (const domNode of inputs) {
            const name:null|string = domNode.getAttribute('name')
            if (name) {
                if (this.inputConfigurations.hasOwnProperty(name)) {
                    /*
                        Exclusive property for retrieving dom node when a
                        single value is needed. Can be used here (for e.g. via
                        "Object.defineProperty" to control how to aggregate
                        when multiple dom nodes are available.
                    */
                    this.inputConfigurations[name].domNode = domNode
                    this.inputConfigurations[name].domNodes.push(domNode)

                    delete missingInputs[name]

                    if (
                        this.resolvedConfiguration.debug &&
                        this.inputConfigurations[name].showIfExpression
                    )
                        domNode.setAttribute(
                            'title',
                            this.inputConfigurations[name].showIfExpression as
                                string
                        )
                } else if (name.includes('.'))
                    // Found input is a computable field.
                    this.inputConfigurations[name] = {
                        /*
                            NOTE: Will depend on all other available model
                            names.
                        */
                        dependsOn: null,
                        domNode,
                        domNodes: [domNode],
                        dynamicExtendExpressions: {value: name},
                        name,
                        properties: {},
                        showIfExpression: name
                    }
                else if (dummyMode)
                    // Nothing is specified: Prototyping mode.
                    this.inputConfigurations[name] = {
                        /*
                            NOTE: Will depend on all other available model
                            names.
                        */
                        dependsOn: null,
                        domNode,
                        domNodes: [domNode],
                        name,
                        properties: {}
                    }
                else {
                    /*
                        Specification exists but corresponding input couldn't
                        be found.
                    */
                    this.message =
                        `Given input "${name}" not found in current ` +
                        'configuration. Expected names are: "' +
                        `${this.inputNames.join('", "')}".`

                    continue
                }

                const configuration:InputConfiguration =
                    this.inputConfigurations[name]

                if (
                    domNode.nodeName.includes('-') &&
                    configuration.properties.hasOwnProperty('value')
                ) {
                    /*
                        Interpret configured values as initial values only to
                        be able to respect dom specific configurations also.
                        We will derive initial value for each input after
                        again when each input has been configured.
                    */
                    configuration.properties.initialValue =
                        configuration.properties.value

                    delete configuration.properties.value
                }

                // Merge dom node and form model configurations.
                if (domNode.externalProperties)
                    if (
                        domNode.externalProperties
                            .model?.dynamicExtendExpressions ||
                        domNode.externalProperties.dynamicExtendExpressions
                    ) {
                        if (!configuration.dynamicExtendExpressions)
                            configuration.dynamicExtendExpressions = {}

                        Tools.extend<RecursivePartial<Model>>(
                            true,
                            configuration.dynamicExtendExpressions,
                            domNode.externalProperties
                                .model?.dynamicExtendExpressions ||
                                {},
                            domNode.externalProperties
                                .dynamicExtendExpressions ||
                                {}
                        )
                    }

                if (configuration.properties.model) {
                    // Do not control "state" from the outside.
                    delete configuration.properties.model!.state

                    if (domNode.externalProperties?.model)
                        // Merge dom node and form model configurations.
                        Tools.extend<RecursivePartial<Model>>(
                            true,
                            configuration.properties.model,
                            domNode.externalProperties.model as
                                RecursivePartial<Model>
                        )
                }

                /*
                    Sort known properties by known inter-dependencies and
                    unknown to ensure deterministic behavior.
                */
                type Key = keyof Partial<InputAnnotation>
                const sortedPropertyNames:Array<Key> =
                    (Object.keys(configuration.properties) as Array<Key>)
                        .sort((firstName:Key, secondName:Key):number => {
                            if (firstName === secondName)
                                return 0

                            const firstIndex:number =
                                this.self.knownPropertyOrdering.indexOf(
                                    firstName
                                )
                            const secondIndex:number =
                                this.self.knownPropertyOrdering.indexOf(
                                    secondName
                                )

                            if (firstIndex === -1 && secondIndex === -1)
                                return firstName < secondName ? -1 : 1

                            return firstIndex === secondIndex ?
                                0 :
                                firstIndex === -1 ?
                                    1 :
                                    firstIndex < secondIndex ?
                                        -1 :
                                        1
                        })

                // Apply all specified properties to its corresponding node.
                for (const key of sortedPropertyNames)
                    if (
                        key === 'model' ||
                        !domNode.externalProperties?.hasOwnProperty(key)
                    ) {
                        /*
                            NOTE: Explicit input specific model configuration
                            has higher priority than form specifications.
                        */
                        console.debug(
                            `Apply form configuration for input "${name}" ` +
                            `with property "${key}" and value "` +
                            Tools.represent(configuration.properties[key]) +
                            '".'
                        )

                        ;(domNode[key as keyof InputAnnotation] as unknown) =
                            configuration.properties[key]
                    } else
                        console.debug(
                            `Form configuration for input "${name}" with ` +
                            `property "${key}" and value "` +
                            Tools.represent(configuration.properties[key]) +
                            '" has been shadowed by dom nodes configuration ' +
                            'value "' +
                            Tools.represent(domNode.externalProperties[key]) +
                            '".'
                        )

                try {
                    /*
                        NOTE: We synchronize input configuration value with dom
                        node value property.
                    */
                    Object.defineProperty(
                        configuration,
                        'value',
                        {
                            get: ():unknown => configuration.domNode!.value,
                            set: (value:unknown):void => {
                                configuration.properties.value = value

                                for (const domNode of configuration.domNodes)
                                    domNode.value = value
                            }
                        }
                    )
                } catch (error) {
                    // Property seems to already been set.
                }

                // Ensure each input has been fully initialized itself.
                await this.digest()

                /*
                    NOTE: We have to determine initial value again since the
                    component usually has initialized itself now. So we have to
                    respect changed default or initial value configuration
                    again.
                */
                if (
                    // Value not initialized or untouched.
                    (
                        [null, undefined].includes(domNode.value as null) ||
                        domNode.pristine
                    ) &&
                    // There is no initial value configured yet.
                    !(
                        [null, undefined].includes(
                            domNode.initialValue as null
                        ) &&
                        [null, undefined].includes(
                            configuration.properties.default as
                                unknown as
                                null
                        ) &&
                        (
                            !configuration.properties.model ||
                            [null, undefined].includes(
                                configuration.properties.model!.default as
                                    unknown as
                                    null
                            ) &&
                            [null, undefined].includes(
                                configuration.properties.model!.value as
                                    unknown as
                                    null
                            )
                        )
                    )
                ) {
                    configuration.value =
                        configuration.properties.model?.value ??
                        domNode.initialValue ??
                        configuration.properties.default ??
                        configuration.properties.model?.default

                    console.debug(
                        `Derive final initial value for input "${name}" to "` +
                        `${configuration.value}".`
                    )
                }


                await this.digest()

                this.initialData[name] = domNode.value
            } else
                this.message =
                    `Missing attribute "name" for ${index}. given input.`

            index += 1
        }

        this.determineInputNames()

        /*
            Set all environment variables as dependencies of no explicit
            dependencies are listed.
        */
        for (const configuration of Object.values(this.inputConfigurations))
            if (
                configuration.hasOwnProperty('dependsOn') &&
                configuration.dependsOn === null
            )
                configuration.dependsOn = this.inputNames

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
        this.groups = []

        const groups:Array<AnnotatedDomNode> = Array.from(
            this.root.querySelectorAll(
                this.resolvedConfiguration.selector.groups
            )
        )

        const originalScopeNames:Array<string> =
            this.self.baseScopeNames.concat(
                'shownSubNodes',
                'subNodes',
                'visibility',
                this.evaluations.map(
                    (evaluation:Evaluation):string => evaluation[0]
                ),
                this.inputNames
            )

        // Determine all first level nested groups or input nodes.
        for (const domNode of groups) {
            const candidates:Array<AnnotatedDomNode> = groups.filter((
                otherDomNode:AnnotatedDomNode
            ):boolean =>
                domNode !== otherDomNode && domNode.contains(otherDomNode)
            )

            const specification:GroupSpecification = {
                childs: candidates.filter((domNode:AnnotatedDomNode):boolean =>
                    !candidates.some((otherDomNode:AnnotatedDomNode):boolean =>
                        otherDomNode !== domNode &&
                        otherDomNode.contains(domNode)
                    )
                ),
                showReason: null
            }

            specification.childs = specification.childs.concat(
                Object.values(this.inputConfigurations)
                    .map(({domNodes}):Array<AnnotatedInputDomNode> => domNodes)
                    .flat()
                    .filter((inputDomNode:AnnotatedInputDomNode):boolean =>
                        domNode.contains(inputDomNode) &&
                        !specification.childs.some(
                            (domNode:AnnotatedDomNode):boolean =>
                                domNode.contains(inputDomNode)
                        )
                    )
            )

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

                specification.showIfExpression = code

                const {error, scopeNames, templateFunction} =
                    Tools.stringCompile(code, originalScopeNames)

                if (error)
                    console.error(
                        'Failed to compile "show-if" group expression ' +
                        `attribute "${name}": ${error}`
                    )
                else
                    specification.showIf = ((
                        shownSubNodes:Array<AnnotatedDomNode>,
                        subNodes:Array<AnnotatedDomNode>
                    ):boolean => {
                        try {
                            return Boolean(templateFunction(
                                this.determineStateURL,
                                this.determinedTargetURL,
                                this.getData,
                                this.initialResponse,
                                this.invalid,
                                this.invalidConstraint,
                                this.latestResponse,
                                this.pending,
                                this.queryParameters,
                                this.response,
                                this.message,
                                this.onceSubmitted,
                                Tools,
                                this.valid,
                                shownSubNodes,
                                subNodes,
                                subNodes.length === 0 ||
                                shownSubNodes.length > 0,
                                ...this._evaluationResults,
                                ...this.inputNames.map((
                                    name:string
                                ):InputConfiguration =>
                                    this.inputConfigurations[name]
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
                    }) as IndicatorFunction
            }

            this.groups.push([domNode, specification])
        }

        /*
            NOTE: We have to reverse order to update visibility states on
            bottom up order since parents visibility states depends on nested
            ones.
        */
        this.groups.reverse()
    }
    /**
     * Generates a mapping from each field name to their corresponding
     * dependent field names.
     * @returns Nothing.
     */
    createDependencyMapping():void {
        this.dependencyMapping = {}

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        )) {
            if (!this.dependencyMapping.hasOwnProperty(name))
                this.dependencyMapping[name] = []

            if (configuration.dependsOn)
                for (const dependentName of ([] as Array<string>).concat(
                    configuration.dependsOn as Array<string>
                ))
                    if (this.dependencyMapping.hasOwnProperty(dependentName)) {
                        if (!this.dependencyMapping[dependentName].includes(
                            name
                        ))
                            this.dependencyMapping[dependentName].push(name)
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
     *
     * @returns Nothing.
     */
    preCompileExpressions(name:string, type:string = 'transformer'):void {
        const typeName:'transformerExpression' = `${type}Expression` as
            'transformerExpression'

        const configuration:InputConfiguration = this.inputConfigurations[name]

        if (configuration[typeName]) {
            const code:string = configuration[typeName] as string
            const {error, scopeNames, templateFunction} = Tools.stringCompile(
                code,
                this.self.baseScopeNames.concat(
                    'self',
                    'value',
                    this.evaluations.map(
                        (evaluation:Evaluation):string => evaluation[0]
                    ),
                    configuration.dependsOn || []
                )
            )

            if (error)
                console.error(
                    `Failed to compile "${typeName}" "${name}": ${error}`
                )

            configuration[type as 'transformer'] = (value:unknown):unknown => {
                try {
                    return templateFunction(
                        this.determineStateURL,
                        this.determinedTargetURL,
                        this.getData,
                        this.initialResponse,
                        this.invalid,
                        this.invalidConstraint,
                        this.latestResponse,
                        this.pending,
                        this.queryParameters,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.valid,
                        configuration,
                        value,
                        ...this._evaluationResults,
                        ...(configuration.dependsOn || [])
                            .map((name:string):InputConfiguration =>
                                this.inputConfigurations[name]
                            )
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
     *
     * @returns Nothing.
     */
    preCompileDynamicExtendStructure(name:string):void {
        const configuration:InputConfiguration = this.inputConfigurations[name]

        if (!configuration.dynamicExtendExpressions)
            return

        configuration.dynamicExtend = {}
        for (const subName in configuration.dynamicExtendExpressions)
            if (
                configuration.dynamicExtendExpressions!.hasOwnProperty(subName)
            ) {
                const code:((event:Event, scope:unknown) => unknown)|string =
                    configuration.dynamicExtendExpressions![subName]

                let originalScopeNames:Array<string> =
                    this.self.baseScopeNames.concat(
                        'event',
                        'eventName',
                        'scope',
                        'selfName',
                        'self',
                        this.evaluations.map(
                            (evaluation:Evaluation):string => evaluation[0]
                        ),
                        configuration.dependsOn || []
                    )
                let scopeNames:Array<string>
                let templateFunction:TemplateFunction<unknown>

                if (typeof code === 'string') {
                    const result:CompilationResult<unknown> =
                        Tools.stringCompile<unknown>(code, originalScopeNames)

                    scopeNames = result.scopeNames
                    templateFunction = result.templateFunction

                    if (result.error)
                        console.error(
                            `Failed to compile "dynamicExtendExpression" for` +
                            ` property "${subName}" in field "${name}":`,
                            result.error
                        )
                } else
                    scopeNames = originalScopeNames.map((name:string):string =>
                        Tools.stringConvertToValidVariableName(name)
                    )

                configuration.dynamicExtend![subName] = (
                    event:Event
                ):unknown => {
                    const scope:Mapping<unknown> = {}
                    const context:Array<unknown> = [
                        this.determineStateURL,
                        this.determinedTargetURL,
                        this.getData,
                        this.initialResponse,
                        this.invalid,
                        this.invalidConstraint,
                        this.latestResponse,
                        this.pending,
                        this.queryParameters,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.valid,
                        event,
                        this.determineEventName(event),
                        scope,
                        name,
                        configuration,
                        ...this._evaluationResults,
                        ...(configuration.dependsOn || [])
                            .map((name:string):InputConfiguration =>
                                this.inputConfigurations[name]
                            )
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
                this.evaluations.map(
                    (evaluation:Evaluation):string => evaluation[0]
                ),
                this.inputNames
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
                ):unknown => {
                    try {
                        return templateFunction(
                            this.determineStateURL,
                            this.determinedTargetURL,
                            this.getData,
                            this.initialResponse,
                            this.invalid,
                            this.invalidConstraint,
                            this.latestResponse,
                            this.pending,
                            this.queryParameters,
                            this.response,
                            this.message,
                            this.onceSubmitted,
                            Tools,
                            this.valid,
                            ...this._evaluationResults,
                            ...this.inputNames.map((
                                name:string
                            ):InputConfiguration =>
                                this.inputConfigurations[name]
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
        this.evaluations = [...this.resolvedConfiguration.evaluations]

        const names:Array<string> =
            this.evaluations.map((evaluation:Evaluation):string =>
                evaluation[0]
            )
        for (const expression of this.resolvedConfiguration.expressions) {
            const [name, code] = expression

            const {error, scopeNames, templateFunction} = Tools.stringCompile(
                code, this.self.baseScopeNames.concat(names, this.inputNames)
            )
            if (error)
                console.error(
                    `Failed to compile generic expression "${name}": ${error}`
                )

            /*
                NOTE: An expression cannot reference itself; so we are adding
                corresponding scope name after compiling (successfully).
            */
            names.push(name)

            this.evaluations.push([name, ():unknown => {
                try {
                    return templateFunction(
                        this.determineStateURL,
                        this.determinedTargetURL,
                        this.getData,
                        this.initialResponse,
                        this.invalid,
                        this.invalidConstraint,
                        this.latestResponse,
                        this.pending,
                        this.queryParameters,
                        this.response,
                        this.message,
                        this.onceSubmitted,
                        Tools,
                        this.valid,
                        ...this._evaluationResults,
                        ...this.inputNames.map((name:string):InputConfiguration =>
                            this.inputConfigurations[name]
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

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        )) {
            configuration.dependsOn =
                ([] as Array<string>).concat(configuration.dependsOn || [])

            for (const type of ['serializer', 'transformer', 'showIf'])
                this.preCompileExpressions(name, type)

            this.preCompileDynamicExtendStructure(name)
        }
    }
    // / endregion
    // / region initialize/submit/reset actions
    /**
     * Can be triggered vie provided action condition. Can e.g. retrieve
     * initial user specific state depending on remote response.
     * @returns Promise resolving to nothing when initial request has been
     * done.
     */
    async initialize():Promise<void> {
        this.triggerEvent(
            'initialize',
            {reference: this.resolvedConfiguration.initializeTarget}
        )

        if (this.resolvedConfiguration.initializeTarget?.url) {
            const target:TargetConfiguration =
                Tools.evaluateDynamicData(
                    Tools.copy(
                        this.resolvedConfiguration.initializeTarget
                    ),
                    {
                        queryParameters: this.queryParameters,
                        Tools,
                        ...this.resolvedConfiguration
                    }
                )

            const event:Event =
                new CustomEvent('initialize', {detail: {target}})

            await this.startBackgroundProcess(event)

            this.initialResponse =
                this.latestResponse =
                await this.doRequest(target)

            if (!this.initialResponse) {
                await this.stopBackgroundProcess(event)

                return
            }

            if (this.resolvedConfiguration.actions.hasOwnProperty(
                'initialize'
            )) {
                this.runEvaluations()

                const target:null|string = this.resolveAction(
                    this.resolvedConfiguration.actions.initialize, 'initialize'
                )

                if (typeof target === 'string') {
                    location.href = target

                    return
                }
            }

            if (this.pending)
                await this.stopBackgroundProcess(event)

            this.triggerEvent('initialized', {target})
        }
    }
    /**
     * Resolve action.
     * @param action - Action to resolve.
     * @param name - Action description.
     *
     * @returns An action url result or undefined.
     */
    resolveAction(action:Action, name:string):null|string {
        const actionResult:unknown = action.indicator()
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
    // // region event handler
    /**
     * Sets all given input fields to their corresponding default values.
     * @param event - Triggered event object.
     *
     * @returns Nothing.
     */
    onClear = (event:MouseEvent):void => {
        void this.doReset(event, true)
    }
    /**
     * Callback triggered when any keyboard events occur.
     * @param event - Keyboard event object.
     *
     * @returns Nothing.
     */
    onKeyDown = (event:KeyboardEvent):void => {
        if (Tools.keyCode.ENTER === event.keyCode)
            this.onSubmit(event)
    }
    /**
     * Sets all given input fields to their corresponding initial values.
     * @param event - Triggered event object.
     *
     * @returns Nothing.
     */
    onReset = (event:MouseEvent):void => {
        void this.doReset(event, false)
    }
    /**
     * Triggers form submit.
     * @param event - Triggered event object.
     *
     * @returns Nothing.
     */
    onSubmit = (event:KeyboardEvent|MouseEvent):void => {
        void this.doSubmit(event)
    }
    /**
     * Clears all given input fields.
     * @param event - Triggered event object.
     *
     * @returns Nothing.
     */
    onTruncate = (event:MouseEvent):void => {
        void this.doReset(event)
    }
    // // endregion
    /**
     * Sets all given input fields to their initial value.
     * @param event - Triggered event object.
     * @param useDefault - Indicates to use default value while resetting.
     *
     * @returns A promise resolving to nothing.
     */
    doReset = async (
        event:MouseEvent, useDefault:boolean|null = null
    ):Promise<void> => {
        event.preventDefault()
        event.stopPropagation()

        for (const name of Object.keys(this.inputConfigurations))
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
     * Sets given input field their initial value.
     * @param name - Name of the field to clear.
     * @param useDefault - Indicates to use default value while resetting.
     *
     * @returns A promise resolving to a boolean indicating whether provided
     * field name exists.
     */
    async resetInput(
        name:string, useDefault:boolean|null = false
    ):Promise<boolean> {
        if (this.inputConfigurations.hasOwnProperty(name)) {
            const configuration:InputConfiguration =
                this.inputConfigurations[name]

            if (useDefault === false && this.initialData.hasOwnProperty(name))
                for (const domNode of configuration.domNodes)
                    domNode.value = Tools.copy(this.initialData[name])
            else if (
                useDefault &&
                configuration.properties.hasOwnProperty('default')
            )
                for (const domNode of configuration.domNodes)
                    domNode.value =
                        Tools.copy(configuration.properties.default)
            else
                for (const domNode of configuration.domNodes)
                    domNode.value = null

            await this.digest()

            return true
        }

        return false
    }
    // / endregion
    /**
     * Calculates current document relative offset of given dom node's
     * position.
     * @param domNode - Target node to calculate from.
     *
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
     *
     * @returns a Promise resolving when focusing has finished.
     */
    scrollAndFocus(
        targetDomNode:AnnotatedDomNode, smooth:boolean = true
    ):Promise<void> {
        return new Promise<void>((resolve:() => void):void => {
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
        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        ))
            if (
                !configuration.shown &&
                configuration.valuePersistence !== 'persistent'
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
        const data:Mapping<unknown> = {}
        const invalidInputNames:Array<string> = []

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        ))
            if (!name.includes('.')) {
                const value:unknown =
                    configuration.transformer ?
                        configuration.transformer!(configuration.value) :
                        configuration.value

                if (configuration.shown && configuration.domNode?.invalid)
                    invalidInputNames.push(name)

                if (name && ![null, undefined].includes(value as null))
                    if (
                        typeof value === 'object' &&
                        configuration.hasOwnProperty('dataMapping')
                    ) {
                        const scope:Mapping<unknown> = {
                            ...value,
                            data,
                            inputConfigurations: this.inputConfigurations,
                            name,
                            item: value
                        }

                        if (typeof configuration.dataMapping === 'string') {
                            const evaluated:EvaluationResult =
                                Tools.stringEvaluate(
                                    configuration.dataMapping as string,
                                    scope
                                )

                            if (evaluated.error)
                                throw new Error(evaluated.error)

                            data[name] = evaluated.result
                        } else
                            for (const subName in (
                                configuration.dataMapping as Mapping
                            ))
                                if ((
                                    configuration.dataMapping as Mapping
                                ).hasOwnProperty(subName)) {
                                    const evaluated:EvaluationResult =
                                        Tools.stringEvaluate(
                                            (configuration.dataMapping as
                                                Mapping
                                            )[subName],
                                            scope
                                        )

                                    if (evaluated.error)
                                        throw new Error(evaluated.error)

                                    data[subName] = evaluated.result
                                }
                    } else if (Array.isArray(value)) {
                        if (value.every((item:unknown):boolean =>
                            item !== null &&
                            typeof item === 'object' &&
                            item!.hasOwnProperty('value')
                        ))
                            data[name] =
                                value.map((item:{value:unknown}):unknown =>
                                    item!.value
                                )
                        else
                            data[name] = value
                    } else
                        data[name] = value
            }

        return {data, invalidInputNames}
    }
    /**
     * Sets global validation message and scrolls to first invalid field.
     * @param data - Data given by the form.
     * @param invalidInputNames - All currently invalid fields names.
     *
     * @returns Nothing.
     */
    handleInvalidSubmittedInput(
        data:Mapping<unknown>, invalidInputNames:Array<string>
    ):void {
        this.updateMessageBox(
            'The following inputs are invalid "' +
            `${invalidInputNames.join('", "')}".`
        )

        const invalidInputs:Array<AnnotatedInputDomNode> = Array.from(
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
     *
     * @returns Redirection target.
     */
    handleValidSentData(
        data:Mapping<unknown>, newWindow:boolean = false
    ):string {
        this.triggerEvent(
            'submitSuccessful',
            {reference: {request: data, response: this.response!.data}}
        )

        let redirected:boolean = false
        let fallbackTarget:string = ''

        this.runEvaluations()

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
     *
     * @returns Nothing.
     */
    handleUnsuccessfulSentRequest(
        response:FormResponse, rawData:null|PlainObject
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
     *
     * @returns A promise wrapping a boolean indicating the requests result.
     */
    async doRequest(
        target:TargetConfiguration, rawData:null|PlainObject = null
    ):Promise<null|FormResponse> {
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

        let result:null|FormResponse = null
        try {
            this.updateReCaptchaToken()

            result = await fetch(target.url, target.options || {}) as
                unknown as
                FormResponse
            let responseString:string = await (result as FormResponse).text()
            if (responseString.startsWith(
                this.resolvedConfiguration.securityResponsePrefix
            ))
                responseString = responseString.substring(
                    this.resolvedConfiguration.securityResponsePrefix.length
                )

            result!.data = JSON.parse(responseString)
            result!.data = Tools.getSubstructure(
                (result as FormResponse).data,
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
     * @param newWindow - Indicates whether action targets should be opened in
     * a new window.
     *
     * @returns Promise holding nothing.
     */
    async handleValidSubmittedInput(
        event:Event, data:Mapping<unknown>, newWindow:boolean = false
    ):Promise<void> {
        this.triggerEvent('validSubmit', {reference: data})
        // region prepare request
        this.runEvaluations()

        this.resolvedConfiguration.data = data
        this.resolvedConfiguration.targetData = this.mapTargetNames(data)
        const target:TargetConfiguration = Tools.evaluateDynamicData(
            Tools.copy(this.resolvedConfiguration.target),
            {
                determineStateURL: this.determineStateURL,
                queryParameters: this.queryParameters,
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
                await this.doRequest(target, data as PlainObject)
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
     *
     * @returns Resulting transformed data.
     */
    mapTargetNames(data:Mapping<unknown>):Mapping<unknown> {
        const result:Mapping<unknown> = {}

        for (const name in data)
            if (data.hasOwnProperty(name))
                if (
                    this.inputConfigurations.hasOwnProperty(name) &&
                    this.inputConfigurations[name].hasOwnProperty('target')
                ) {
                    if (
                        typeof this.inputConfigurations[name].target ===
                            'string' &&
                        (this.inputConfigurations[name].target as string)
                            .length
                    )
                        result[
                            this.inputConfigurations[name].target as string
                        ] = data[name]
                } else
                    result[name] = data[name]

        return result
    }
    /**
     * Check validation state of all content projected inputs, represents
     * overall validation state and sends data to configured target.
     * @param event - Triggered event object.
     *
     * @returns Nothing.
     */
    doSubmit = async (event:KeyboardEvent|MouseEvent):Promise<void> => {
        try {
            event.preventDefault()
            event.stopPropagation()

            if (this.submitted || this.pending)
                return

            this.invalid = true
            this.invalidConstraint = null
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

            this.runEvaluations()

            await this.resetAllHiddenNonPersistentInputs()

            const {data, invalidInputNames} = this.getData()

            if (invalidInputNames.length) {
                // Trigger input components to present their validation state.
                for (const {domNodes} of Object.values(this.inputConfigurations))
                    for (const domNode of domNodes)
                        domNode.showInitialValidationState = true
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

                const fieldValues:Array<InputConfiguration> =
                    this.inputNames.map((name:string):InputConfiguration =>
                        this.inputConfigurations[name]
                    )
                const values:Array<unknown> = [
                    this.determineStateURL,
                    this.determinedTargetURL,
                    this.getData,
                    this.initialResponse,
                    this.invalid,
                    this.invalidConstraint,
                    this.latestResponse,
                    this.pending,
                    this.queryParameters,
                    this.response,
                    this.message,
                    this.onceSubmitted,
                    Tools,
                    this.valid,
                    ...fieldValues
                ]
                const scope:Mapping<unknown> = this.self.baseScopeNames
                    .concat(this.inputNames)
                    .reduce(
                        (
                            scope:Mapping<unknown>, name:string, index:number
                        ):Mapping<unknown> => {
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
                        this.invalidConstraint = constraint
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

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        )) {
            scope.name = name
            for (const domNode of configuration.domNodes)
                this.applyBindings(domNode, scope)

            if (!this.inputEventBindings.hasOwnProperty(name)) {
                const eventName:string =
                    configuration.hasOwnProperty('changedEventName') ?
                        configuration.changedEventName as string :
                        'change'

                const handler:EventListener = Tools.debounce<void>(
                    (async (event:Event):Promise<void> => {
                        await this.digest()

                        let lock:Lock

                        if (event.target)
                            this.inputConfigurations[name].domNode =
                                event.target as AnnotatedInputDomNode

                        this.runEvaluations()

                        if (this.dependencyMapping[name].length) {
                            lock = new Lock()

                            await lock.acquire('digest')
                            await this.updateInputDependencies(name, event)
                        }

                        this.updateAllGroups()

                        if (this.dependencyMapping[name].length)
                            await lock!.release('digest')
                    }) as UnknownFunction,
                    400
                )

                for (const domNode of this.inputConfigurations[name].domNodes)
                    domNode.addEventListener(eventName, handler)

                this.inputEventBindings[name] = ():void => {
                    for (
                        const domNode of
                            this.inputConfigurations[name].domNodes
                    )
                        domNode.removeEventListener(eventName, handler)

                    delete this.inputEventBindings[name]
                }
            }
        }
    }
    /**
     * Updates all fields.
     * @param event - Triggering event object.
     *
     * @returns Promise holding nothing.
     */
    async updateAllInputs(event:Event):Promise<void> {
        for (const name of Object.keys(this.inputConfigurations))
            await this.updateInput(name, event)
    }
    /**
     * Updates given input (by name) dynamic expression and its visibility
     * state.
     * @param name - Field name to update.
     * @param event - Triggering event object.
     *
     * @returns A Promise resolving to a boolean indicator whether a state
     * changed happened or not.
     */
    async updateInput(name:string, event:Event):Promise<boolean> {
        this.runEvaluations()

        // We have to check for real state changes to avoid endless loops.
        let changed:boolean = false
        if (this.inputConfigurations[name].hasOwnProperty('dynamicExtend'))
            for (
                const selector in this.inputConfigurations[name].dynamicExtend
            ) {
                let invert:boolean = false
                let mappedSelector:string = selector
                if (this.self.specificationToPropertyMapping.hasOwnProperty(
                    selector
                )) {
                    invert = Boolean(
                        this.self.specificationToPropertyMapping[selector]
                            .invert
                    )
                    mappedSelector =
                        this.self.specificationToPropertyMapping[selector].name
                }

                const index:number = mappedSelector.lastIndexOf('.')

                const path:Array<string>|string =
                    index > 0 ? mappedSelector.substring(0, index) : []
                const key:string = index > 0 ?
                    mappedSelector.substring(index + 1) :
                    mappedSelector

                const target:Mapping<unknown> = Tools.getSubstructure(
                    this.inputConfigurations[name].properties, path
                )

                const oldValue:unknown = target[key]
                let newValue:unknown =
                    this.inputConfigurations[name].dynamicExtend![selector](
                        event
                    )
                if (invert)
                    newValue = !newValue

                if (oldValue !== newValue) {
                    changed = true

                    if (mappedSelector !== 'value')
                        target[key] = newValue

                    console.debug(
                        `Change "${selector}" on "${name}" from "${oldValue}` +
                        `" to "${newValue}".`
                    )

                    Tools.getSubstructure<
                        Partial<InputAnnotation>, Mapping<unknown>
                    >(this.inputConfigurations[name].properties, path)[key] =
                        newValue
                    for (
                        const domNode of
                            this.inputConfigurations[name].domNodes
                    )
                        Tools.getSubstructure<
                            AnnotatedInputDomNode, Mapping<unknown>
                        >(domNode, path)[key] = newValue

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
     *
     * @returns Promise holding nothing.
     */
    async updateInputDependencies(name:string, event:Event):Promise<void> {
        for (const dependentName of this.dependencyMapping[name])
            await this.updateInput(dependentName, event)
    }
    /**
     * Trigger inputs internal change detection.
     * @param name - Field name to update their model.
     *
     * @returns A promise resolving to nothing.
     */
    async triggerModelUpdate(name:string):Promise<void> {
        if (this.inputConfigurations.hasOwnProperty(name))
            for (const domNode of this.inputConfigurations[name].domNodes) {
                if (typeof domNode.changeTrigger === 'function') {
                    const result:unknown =
                        (domNode.changeTrigger as Function)()

                    if ('then' in (result as Promise<unknown>))
                        await result
                } else if (Object.prototype.hasOwnProperty.call(
                    domNode, 'changeTrigger'
                )) {
                    domNode.changeTrigger = !domNode.changeTrigger

                    await this.digest()
                }
            }
        else
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
     *
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
     * Evaluate all generic expression results.
     * @returns Nothing.
     */
    runEvaluations():void {
        this._evaluationResults = []

        for (const evaluation of this.evaluations)
            this._evaluationResults.push(evaluation[1]())
    }
    /**
     * Indicates a background running process. Sets "pending" property and
     * triggers a loading spinner.
     * @param event - Triggering event object.
     *
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async startBackgroundProcess(event:Event):Promise<void> {
        this.showSpinner()

        this.pending = true

        this.runEvaluations()

        await this.updateAllInputs(event)

        this.updateAllGroups()
    }
    /**
     * Stops indicating a background running process. Sets "pending" property
     * and stop showing a loading spinner.
     * @param event - Triggering event object.
     *
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async stopBackgroundProcess(event:Event):Promise<void> {
        this.pending = false

        this.runEvaluations()

        await this.updateAllInputs(event)

        this.updateAllGroups()

        this.hideSpinner()
    }
    /**
     * Determines whether the current value state can be derived by given
     * configuration or has to be saved.
     * @param name - Model name to derive from.
     *
     * @returns A boolean indicating the neediness.
     */
    determinedStateValueIsNeeded(name:string):boolean {
        const domNode:AnnotatedInputDomNode|undefined =
            this.inputConfigurations[name].domNode

        return !(
            !domNode ||
            domNode.initialValue &&
            domNode.initialValue === domNode.value ||
            domNode.initialValue === undefined &&
            domNode.value === domNode.default ||
            /*
                NOTE: If only a boolean value we do not have to save an
                explicit or implicit default.
            */
            !domNode.default &&
            !domNode.value &&
            domNode.type === 'boolean' &&
            /*
                NOTE: If only one possible state exists we do not have to save
                that state.
            */
            !(
                domNode.selection &&
                (
                    Array.isArray(domNode.selection) &&
                    domNode.selection!.length > 1 ||
                    !Array.isArray(domNode.selection) &&
                    Object.keys(domNode.selection!).length > 1
                )
            )
        )
    }
    /**
     * Determines current state url.
     * @returns URL.
     */
    determineStateURL = ():StateURL => {
        let parameter:NormalizedConfiguration =
            this.self.normalizeConfiguration(this.urlConfiguration || {})

        if (!Tools.isPlainObject(parameter.inputs))
            parameter.inputs = {}

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        ))
            if (
                configuration.domNode &&
                (
                    configuration.domNode.dirty ||
                    /*
                        NOTE: This input seems to have limited input state
                        support so we have to consider this.
                    */
                    configuration.domNode.dirty !== false &&
                    (
                        configuration.domNode.constructor as
                            unknown as
                            StaticWebComponent
                    ).webComponentAdapterWrapped !== 'react'
                )
            )
                if (parameter.inputs.hasOwnProperty(name)) {
                    if (!parameter.inputs[name as keyof Model]!.hasOwnProperty(
                        'properties'
                    ))
                        parameter.inputs[name as keyof Model]!.properties = {}

                    if (
                        this.inputConfigurations[name].value !==
                            parameter.inputs[name as keyof Model]!.properties!
                                .value
                    )
                        /*
                            NOTE: Initial values derived from existing state
                            url shouldn't be a problem because of the prior
                            condition.
                         */
                        if (this.determinedStateValueIsNeeded(name))
                            parameter.inputs[name]!.properties!.value =
                                configuration.serializer ?
                                    configuration.serializer!(
                                        configuration.value
                                    ) :
                                    configuration.value
                        else {
                            delete parameter.inputs[name as keyof Model]!
                                .properties!.value

                            if (Object.keys(
                                parameter.inputs[name as keyof Model]!
                                    .properties!
                            ).length === 0)
                                delete parameter.inputs[name]!.properties

                            if (Object.keys(
                                parameter.inputs[name as keyof Model]!
                            ).length === 0)
                                delete parameter.inputs[name]
                        }
                /*
                    NOTE: Initial values derived from existing state url
                    shouldn't be a problem because of the prior condition.
                 */
                } else if (this.determinedStateValueIsNeeded(name))
                    parameter.inputs[name] = {
                        properties: {
                            value: configuration.serializer ?
                                configuration.serializer!(
                                    configuration.value
                                ) :
                                configuration.value
                        }
                    }

        if (parameter.evaluations.length === 0)
            delete (parameter as Partial<NormalizedConfiguration>).evaluations
        if (parameter.expressions.length === 0)
            delete (parameter as Partial<NormalizedConfiguration>).expressions

        if (parameter.tag.values.length === 0)
            delete (parameter.tag as Partial<NormalizedConfiguration['tag']>)
                .values
        if (Object.keys(parameter.tag).length === 0)
            delete (parameter as Partial<NormalizedConfiguration>).tag

        // Use only allowed configuration fields.
        const maskedParameter:RecursivePartial<NormalizedConfiguration> =
            Tools.mask<NormalizedConfiguration>(
                parameter, this.resolvedConfiguration.urlConfigurationMask
            )

        if (
            maskedParameter.inputs &&
            Object.keys(maskedParameter.inputs).length === 0
        )
            delete maskedParameter.inputs

        const result:StateURL = {
            encoded: document.URL, plain: decodeURI(document.URL)
        }
        if (Object.keys(maskedParameter).length) {
            for (const [key, value] of Object.entries(result))
                result[key as keyof StateURL] = value
                    .replace(
                        new RegExp(
                            `\\?${this.resolvedConfiguration.name}=[^&]*&`, 'g'
                        ),
                        '?'
                    )
                    .replace(
                        new RegExp(
                            `([&?]${this.resolvedConfiguration.name}=[^&]*$)` +
                            `|(&${this.resolvedConfiguration.name}=[^&]*)`,
                            'g'
                        ),
                        ''
                    )

            // Ensure normalized urls via recursive property sorting.
            const allKeys:Array<string> = []
            const seenKeys:Mapping<null> = {}
            // First just determine all available keys.
            JSON.stringify(
                maskedParameter,
                (key:string, value:unknown):unknown => {
                    if (!seenKeys.hasOwnProperty(key)) {
                        allKeys.push(key)
                        seenKeys[key] = null
                    }

                    return value
                }
            )
            allKeys.sort()
            // Now do the real serializing job.
            const value:string = JSON.stringify(maskedParameter, allKeys, '')

            const encodedQueryParameter:string =
                `${this.resolvedConfiguration.name}=` +
                encodeURIComponent(value)
            const queryParameter:string =
                `${this.resolvedConfiguration.name}=${value}`
            if (result.plain.includes('?')) {
                if (!(
                    result.plain.endsWith('?') || result.plain.endsWith('&')
                )) {
                    result.encoded += '&'
                    result.plain += '&'
                }
            } else {
                result.encoded += '?'
                result.plain += '?'
            }
            result.encoded += encodedQueryParameter
            result.plain += queryParameter
        }

        return result
    }
    /**
     * Tracks given data if tracking environment exists.
     * @param name - Event name to trigger.
     * @param data - Data to track.
     *
     * @returns Nothing.
     */
    triggerEvent(name:string, data:Mapping<unknown>):boolean {
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
        if (
            window.grecaptcha && !window.grecaptcha.render && window.location
        ) {
            location.reload()

            return false
        }

        if (
            window.grecaptcha &&
            this.reCaptchaFallbackInput &&
            (
                this.resolvedConfiguration.showAll ||
                this.resolvedConfiguration.reCaptcha?.key?.v2 &&
                (this.resolvedConfiguration.target as TargetConfiguration)?.url
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

                this.show(this.reCaptchaFallbackInput)
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
            (this.resolvedConfiguration.target as TargetConfiguration)?.url
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
