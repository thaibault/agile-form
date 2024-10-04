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
import {
    $,
    camelCaseToDelimited,
    compile,
    CompilationResult,
    convertToValidVariableName,
    copy,
    debounce,
    evaluate,
    evaluateDynamicData,
    EvaluationResult,
    extend,
    getSubstructure,
    getURLParameter,
    isFunction,
    isPlainObject,
    KEYBOARD_CODES,
    Lock,
    Offset,
    Mapping,
    mask,
    MAXIMAL_SUPPORTED_INTERNET_EXPLORER_VERSION,
    PlainObject,
    QueryParameters,
    RecursiveEvaluateable,
    RecursivePartial,
    represent,
    TemplateFunction,
    timeout,
    UnknownFunction,
    UTILITY_SCOPE,
    UTILITY_SCOPE_NAMES,
    UTILITY_SCOPE_VALUES
} from 'clientnode'
import {object} from 'clientnode/dist/property-types'
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
    FormResponse,
    GivenEvaluations,
    GivenNamedEvaluations,
    GroupSpecification,
    IndicatorFunction,
    InputAnnotation,
    InputConfiguration,
    Model,
    NormalizedConfiguration,
    ResponseResult,
    StateURL,
    TargetAction,
    TargetConfiguration
} from './type'
// endregion
// region components
/**
 * Form handler which accepts a various number of content projected dom nodes
 * to interact with them following a given specification object.
 * @property baseScopeNames - List of generic scope names available in all
 * evaluations environments.
 * @property defaultConfiguration - Holds default extendable configuration
 * object.
 * @property specificationToPropertyMapping - Mapping model specification keys
 * to their corresponding input field property name (if not equal).
 * @property knownPropertyOrdering - Order of known properties to apply on
 * inputs.
 * @property actionResults - Mapping of action names to their results.
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
 * @property lock - Holds lock instance for saving instance specific locks.
 * @property _evaluationResults - Last known evaluation result cache.
 */
export class AgileForm<
    TElement = HTMLElement,
    ExternalProperties extends Mapping<unknown> = Mapping<unknown>,
    InternalProperties extends Mapping<unknown> = Mapping<unknown>,
> extends Web<TElement, ExternalProperties, InternalProperties> {
    // region properties
    static baseScopeNames = [
        'actionResults',

        'determineStateURL',
        'determinedTargetURL',

        'getData',

        'initialResponse',
        'latestResponse',
        'response',

        'submitted',
        'pending',
        'invalid',
        'valid',
        'invalidConstraint',

        'queryParameters',

        'stateMessage',

        ...UTILITY_SCOPE_NAMES
    ]
    static content = '<form novalidate><slot></slot></form>'
    static defaultConfiguration: RecursiveEvaluateable<Configuration> = {
        actions: {},
        targetActions: {},

        animation: true,
        constraints: [],
        data: null,
        debug: false,
        evaluations: [],
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

                file-input, text-input, generic-inputs,
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
        urlConfigurationCharacterLimit: 800,
        version: 1
    }
    static inputValueMapping: Mapping<(value: unknown) => unknown> = {
        'slider-input': (value: unknown): number =>
            typeof value === 'number' ? value : 0
    }
    static specificationToPropertyMapping: Mapping<{
        invert?: boolean
        name: string
    }> = {
        /*
            e.g.:

            nullable: {
                invert: true,
                name: 'required'
            }
        */
        }
    static knownPropertyOrdering = [
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

    actionResults: Mapping<unknown> = {}

    clearButtons: Array<AnnotatedDomNode> = []
    resetButtons: Array<AnnotatedDomNode> = []
    spinner: Array<AnnotatedDomNode> = []
    statusMessageBoxes: Array<AnnotatedDomNode> = []
    submitButtons: Array<AnnotatedDomNode> = []
    truncateButtons: Array<AnnotatedDomNode> = []

    dependencyMapping: Mapping<Array<string>> = {}

    evaluations: Array<Evaluation> = []

    groups: Array<[AnnotatedDomNode, GroupSpecification]> = []

    determinedTargetURL: null|string = null
    initialData: Mapping<unknown> = {}
    initialResponse: null|FormResponse = null
    latestResponse: null|FormResponse = null
    message = ''
    response: FormResponse|null = null

    inputEventBindings: Mapping<() => void> = {}
    inputConfigurations: Mapping<InputConfiguration> = {}
    inputNames: Array<string> = []

    invalid: boolean|null = null
    invalidConstraint: Constraint|null = null
    onceSubmitted = false
    pending = true
    submitted = false
    valid: boolean|null = null

    reCaptchaFallbackInput: AnnotatedDomNode|null = null
    reCaptchaFallbackRendered = false
    /*
        NOTE: Will be finally initialized when promise is created so do not
        change order here.
    */
    reCaptchaPromiseResolver: (result: null|string) => void =
        () => {
            // Does nothing yet.
        }
    reCaptchaPromise = new Promise<null|string>(
        (resolve: (result: null|string) => void) => {
            this.reCaptchaPromiseResolver = resolve
        }
    )
    reCaptchaToken: null|string = null

    @property({type: object})
        additionalConfiguration: RecursivePartial<Configuration>|undefined
    @property({type: object})
        baseConfiguration: RecursivePartial<Configuration>|undefined
    @property({type: object})
        configuration: RecursivePartial<Configuration>|undefined
    @property({type: object})
        dynamicConfiguration: RecursivePartial<Configuration>|undefined
    resolvedConfiguration: Configuration = {} as Configuration
    urlConfiguration: null|RecursivePartial<Configuration> = null
    queryParameters: QueryParameters

    readonly self = AgileForm

    readonly lock = new Lock()

    _evaluationResults: Array<unknown> = []
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

        this.queryParameters = getURLParameter() as QueryParameters

        this.resolveConfiguration()
    }
    /**
     * Parses given configuration object and delegates to forward them to
     * nested input nodes.
     * @param name - Attribute name which was updates.
     * @param oldValue - Old attribute value.
     * @param newValue - New updated value.
     */
    attributeChangedCallback(
        name: string, oldValue: string, newValue: string
    ) {
        super.attributeChangedCallback(name, oldValue, newValue)

        this.resolveConfiguration()
    }
    /**
     * Registers new re-captcha token.
     */
    connectedCallback() {
        super.connectedCallback()

        void this.updateReCaptchaToken()
    }
    /**
     * De-registers all needed event listener.
     */
    disconnectedCallback(): void {
        super.disconnectedCallback()

        this.root.removeEventListener(
            'keydown', this.onKeyDown as EventListenerOrEventListenerObject
        )
        for (const domNode of this.clearButtons)
            domNode.removeEventListener('click', this.onClear)
        for (const domNode of this.resetButtons)
            domNode.removeEventListener('click', this.onReset)
        for (const domNode of this.submitButtons)
            domNode.removeEventListener('click', this.onSubmit)
        for (const domNode of this.truncateButtons)
            domNode.removeEventListener('click', this.onTruncate)

        for (const action of Object.values(this.resolvedConfiguration.actions))
            for (const domNode of action.determinedDomNodes)
                domNode.removeEventListener(
                    action.event || 'click', action.handler
                )

        for (const callback of Object.values(this.inputEventBindings))
            callback()
    }
    /**
     * Triggered when content projected and nested dom nodes are ready to be
     * traversed. Selects all needed dom nodes.
     * @param reason - Description why rendering is necessary.
     * @returns A promise resolving to nothing.
     */
    async render(reason = 'unknown'): Promise<void> {
        if (!this.dispatchEvent(new CustomEvent('render', {detail: {reason}})))
            return

        /*
            NOTE: We need a digest loop to allow the components to extend given
            model object with their defaults.
        */
        await this.digest()
        await this.configureContentProjectedElements()

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

        this.root.addEventListener(
            'keydown', this.onKeyDown as EventListenerOrEventListenerObject
        )
        for (const domNode of this.clearButtons)
            domNode.addEventListener('click', this.onClear)
        for (const domNode of this.resetButtons)
            domNode.addEventListener('click', this.onReset)
        for (const domNode of this.submitButtons)
            domNode.addEventListener('click', this.onSubmit)
        for (const domNode of this.truncateButtons)
            domNode.addEventListener('click', this.onTruncate)

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
     */
    fade(
        domNode: AnnotatedDomNode, opacity = 1, durationInMilliseconds = 100
    ): void {
        if (domNode.clearFading)
            void domNode.clearFading()

        if (parseFloat(domNode.style.opacity) === opacity)
            return

        if (opacity === 0) {
            const style: Mapping<number|string> = $(domNode).Tools('style')

            domNode.oldDisplay = style.display as string || 'initial'
            if (domNode.oldDisplay === 'none')
                delete domNode.oldDisplay

            if (!this.resolvedConfiguration.animation) {
                domNode.style.display = 'none'

                return
            }

            const oldPosition: string = domNode.style.position
            /*
                Make this element absolute at current position to potentially
                fade other elements in at overlapping position.
            */
            domNode.style.position = 'absolute'

            let currentOpacity: number =
                domNode.oldOpacity =
                parseFloat(style.opacity as string)
            const timer = setInterval(
                () => {
                    if (currentOpacity <= opacity + .1) {
                        if (domNode.clearFading)
                            void domNode.clearFading()
                        return
                    }

                    currentOpacity -= currentOpacity * .1
                    domNode.style.opacity = String(currentOpacity)
                },
                durationInMilliseconds * .1
            )

            domNode.clearFading = () => {
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
                () => {
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

            domNode.clearFading = () => {
                clearInterval(timer)

                domNode.style.opacity = `${domNode.oldOpacity || 1}`

                delete domNode.clearFading
            }
        }
    }
    /**
     * Adds given dom nodes visual representation.
     * @param domNode - Node to show.
     */
    show(domNode: AnnotatedDomNode) {
        this.fade(domNode)

        domNode.removeAttribute('aria-hidden')
    }
    /**
     * Removes given dom nodes visual representation.
     * @param domNode - Node to hide.
     */
    hide(domNode: AnnotatedDomNode) {
        this.fade(domNode, 0)

        domNode.setAttribute('aria-hidden', 'true')
    }
    /**
     * Shows the spinner.
     */
    showSpinner() {
        if (this.spinner.length) {
            for (const domNode of this.spinner)
                this.show(domNode)

            void this.scrollAndFocus(this.spinner[0])
        }
    }
    /**
     * Hides the spinner.
     */
    hideSpinner() {
        for (const domNode of this.spinner)
            this.hide(domNode)
    }
    /**
     * Updates given field (by name) visibility state.
     * @param name - Field name to update.
     * @returns A promise resolving to a boolean value indicating whether a
     * visibility change happened.
     */
    async updateInputVisibility(name: string): Promise<boolean> {
        const inputConfiguration: InputConfiguration =
            this.inputConfigurations[name]

        const oldState: boolean|undefined = inputConfiguration.shown

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
     */
    updateAllGroups(): void {
        for (const [domNode, specification] of this.groups) {
            const name: string =
                domNode.getAttribute('name') ??
                domNode.getAttribute('data-name') ??
                'unknown'
            const oldState: boolean|null = domNode.shown

            const shownSubNodes: Array<AnnotatedDomNode> = (
                specification.childs.filter((
                    node: AnnotatedDomNode
                ): boolean => node.shown)
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
     */
    updateGroupContent(domNode: AnnotatedDomNode): void {
        const scope: Mapping<unknown> = {}
        const keys: Array<string> = this.self.baseScopeNames.concat(
            this.evaluations.map(
                (evaluation: Evaluation): string => evaluation[0]
            ),
            this.inputNames
        )

        const values: Array<unknown> = [
            this.actionResults,

            this.determineStateURL,
            this.determinedTargetURL,

            this.getData,

            this.initialResponse,
            this.latestResponse,
            this.response,

            this.onceSubmitted,
            this.pending,
            this.invalid,
            this.valid,
            this.invalidConstraint,

            this.queryParameters,

            this.message,

            ...UTILITY_SCOPE_VALUES,

            ...this._evaluationResults,
            ...this.inputNames.map((name: string): InputConfiguration =>
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
                filter: (domNode: HTMLElement): boolean =>
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
     */
    updateMessageBox(message?: null|string): void {
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
    /// region configuration
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
     * @returns Normalized configuration.
     */
    static normalizeURLConfiguration(
        configuration: PlainObject
    ): RecursivePartial<Configuration> {
        const currentConfiguration: PlainObject = copy(configuration)

        // Consolidate aliases for "input" configuration item.
        const inputs: Mapping<RecursivePartial<InputConfiguration>> =
            currentConfiguration.inputs as
                Mapping<RecursivePartial<InputConfiguration>> ||
            {}
        if (currentConfiguration.model) {
            extend(
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
                    (input.properties as InputAnnotation)[
                        key as 'value'
                    ] = (input as InputAnnotation)[key as 'value']

                    delete (input as {
                        selection?: unknown
                        value?: unknown
                    })[key]
                }

            if (Object.prototype.hasOwnProperty.call(input, 'nullable')) {
                (input.properties as InputAnnotation).required =
                    !(input as {nullable?: boolean}).nullable

                delete (input as {nullable?: boolean}).nullable
            }

            for (const key of ['mutable', 'writable'] as const)
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    (input.properties as InputAnnotation)
                        .disabled = !(input as {
                            mutable?: boolean
                            writable?: boolean
                        })[key]

                    delete (input as {
                        mutable?: boolean
                        writable?: boolean
                    })[key]
                }
        }

        if (Object.keys(inputs).length)
            (currentConfiguration as
                unknown as
                {inputs: Mapping<RecursivePartial<InputConfiguration>>}
            ).inputs = inputs

        return currentConfiguration as RecursivePartial<Configuration>
    }
    /**
     * Normalizes given evaluations.
     * @param evaluations - Given evaluations to normalize.
     * @returns Normalized evaluations.
     */
    static normalizeEvaluations(
        evaluations?: GivenEvaluations
    ): Array<Evaluation> {
        const preEvaluations: Array<GivenNamedEvaluations> = []
        const postEvaluations: Array<GivenNamedEvaluations> = []

        let normalizedEvaluations: Array<Evaluation> = []
        if (Array.isArray(evaluations)) {
            for (const evaluation of evaluations)
                if (Array.isArray(evaluation) && evaluation.length > 1)
                    normalizedEvaluations.push([
                        evaluation[0] as string, evaluation[1] as unknown
                    ])
                else if (evaluation !== null && typeof evaluation === 'object')
                    normalizedEvaluations = normalizedEvaluations.concat(
                        Object.entries(evaluation as Mapping<unknown>)
                    )
                else if (evaluations.length > 1) {
                    normalizedEvaluations = [
                        evaluations.splice(0, 2) as [string, unknown]
                    ]

                    break
                }
        } else if (
            evaluations !== null &&
            typeof evaluations === 'object' &&
            Object.keys(evaluations).length > 0
        ) {
            const namedEvaluationsList: Array<GivenNamedEvaluations> =
                Object.values(evaluations) as Array<GivenNamedEvaluations>

            if (
                namedEvaluationsList[0] !== null &&
                typeof namedEvaluationsList[0] === 'object' &&
                typeof namedEvaluationsList[0].order === 'number' &&
                Object.prototype.hasOwnProperty.call(
                    namedEvaluationsList[0], 'evaluations'
                )
            )
                for (const namedEvaluations of namedEvaluationsList)
                    if (namedEvaluations.order < 0)
                        preEvaluations.push(namedEvaluations)
                    else if (namedEvaluations.order > 0)
                        postEvaluations.push(namedEvaluations)
                    else
                        normalizedEvaluations =
                            AgileForm.normalizeEvaluations(
                                namedEvaluations.evaluations
                            )
            else
                normalizedEvaluations = Object.entries(evaluations)
        }

        normalizedEvaluations = preEvaluations
            .sort((
                first: GivenNamedEvaluations, second: GivenNamedEvaluations
            ): number => first.order - second.order)
            .map(
                (namedEvaluations: GivenNamedEvaluations): Array<Evaluation> =>
                    AgileForm.normalizeEvaluations(
                        namedEvaluations.evaluations
                    )
            )
            .flat()
            .concat(normalizedEvaluations)
            .concat(
                postEvaluations
                    .sort(
                        (
                            first: GivenNamedEvaluations,
                            second: GivenNamedEvaluations
                        ): number =>
                            first.order - second.order
                    )
                    .map((namedEvaluations: GivenNamedEvaluations): Array<
                        Evaluation
                    > =>
                        AgileForm.normalizeEvaluations(
                            namedEvaluations.evaluations
                        )
                    )
                    .flat()
            )

        return normalizedEvaluations
    }
    /**
     * Normalizes given configuration.
     * @param configuration - Configuration object to normalize.
     * @returns Normalized configuration.
     */
    static normalizeConfiguration(
        configuration: RecursivePartial<Configuration>
    ): NormalizedConfiguration {
        const currentConfiguration: RecursivePartial<Configuration> =
            copy(configuration)

        currentConfiguration.evaluations = AgileForm.normalizeEvaluations(
            currentConfiguration.evaluations as GivenEvaluations|undefined
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
                    currentConfiguration as unknown as {tags: Array<string>}
                ).tags)

            delete currentConfiguration.tags
        }

        return currentConfiguration as NormalizedConfiguration
    }
    /**
     * Merge given configuration into resolved configuration object.
     * @param configuration - Configuration to merge.
     */
    mergeConfiguration(configuration: RecursivePartial<Configuration>) {
        const normalizedConfiguration: NormalizedConfiguration =
            this.self.normalizeConfiguration(configuration)

        // Merge evaluations.
        normalizedConfiguration.evaluations =
            (this.resolvedConfiguration.evaluations as Array<Evaluation>)
                .concat(normalizedConfiguration.evaluations)

        extend(
            true,
            this.resolvedConfiguration,
            normalizedConfiguration as RecursivePartial<Configuration>
        )
    }
    /**
     * Resolve and merges configuration sources into final object.
     */
    resolveConfiguration(): void {
        this.resolvedConfiguration = this.self.normalizeConfiguration(
            this.self.defaultConfiguration as RecursivePartial<Configuration>
        ) as Configuration

        for (const configuration of [
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
            extend<TargetConfiguration>(
                true,
                copy<TargetConfiguration>(
                    this.resolvedConfiguration.target as TargetConfiguration
                ),
                this.resolvedConfiguration.initializeTarget
            )

        if (this.resolvedConfiguration.debug)
            console.debug(
                'Got configuration:', represent(this.resolvedConfiguration)
            )
    }
    /**
     * Determines configuration by existing url parameter.
     * @returns Nothing.
     */
    getConfigurationFromURL(): null|RecursivePartial<Configuration> {
        const parameter: Array<string>|string|undefined =
            this.queryParameters[this.resolvedConfiguration.name]
        if (typeof parameter === 'string') {
            const evaluated: EvaluationResult = evaluate(parameter)

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
                return mask<RecursivePartial<Configuration>>(
                    this.self.normalizeURLConfiguration(evaluated.result),
                    this.resolvedConfiguration.urlConfigurationMask
                ) as RecursivePartial<Configuration>
        }

        return null
    }
    /// endregion
    /// region apply configurations to components
    /**
     * Determines action triggering dom nodes to add event listener to.
     */
    registerActionListener(): void {
        for (const [name, action] of Object.entries(
            this.resolvedConfiguration.actions
        )) {
            action.determinedDomNodes =
                action.domNodes ? [...action.domNodes] : []
            if (action.globalSelectors)
                for (const selector of action.globalSelectors)
                    action.determinedDomNodes =
                        action.determinedDomNodes.concat(Array.from(
                            document.documentElement.querySelectorAll(selector)
                        ))
            if (action.localSelectors)
                for (const selector of action.localSelectors)
                    action.determinedDomNodes =
                        action.determinedDomNodes.concat(Array.from(
                            this.root.querySelectorAll(selector)
                        ))
            else
                action.determinedDomNodes =
                    action.determinedDomNodes.concat(Array.from(
                        this.root.querySelectorAll(`[action="${name}"]`)
                    ))

            action.handler = (event: Event) => {
                void (async (): Promise<void> => {
                    await this.startBackgroundProcess(event)
                    await action.run(event, action)
                    await this.stopBackgroundProcess(event)
                })()
            }

            for (const domNode of action.determinedDomNodes)
                domNode.addEventListener(
                    action.event || 'click', action.handler
                )
        }
    }
    /**
     * Forwards all input specifications to their corresponding input node.
     * Observes fields for changes to apply specified inter-constraints between
     * them.
     */
    async configureContentProjectedElements(): Promise<void> {
        const lockName = 'configureContentProjectedElements'
        await this.lock.acquire(lockName)

        const missingInputs: Mapping<InputConfiguration> =
            await this.connectSpecificationWithDomNodes()

        this.registerActionListener()

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
     * Determine all environment variables to run expressions again. We have to
     * do this a second time to include dynamically added inputs in prototyping
     * mode.
     */
    determineInputNames() {
        this.inputNames = Object.keys(this.inputConfigurations)
            .filter((name: string): boolean => !name.includes('.'))
            .map((name: string): string => convertToValidVariableName(name))
    }
    /**
     * Finds all fields and connects them with their corresponding model
     * specification.
     * @returns An object mapping with missing but specified fields.
     */
    async connectSpecificationWithDomNodes(): Promise<Mapping<
        InputConfiguration
    >> {
        const inputCandidates: Array<AnnotatedInputDomNode> =
            Array.from(this.root.querySelectorAll(
                this.resolvedConfiguration.selector.inputs
            ))

        const inputs: Array<AnnotatedInputDomNode> = inputCandidates.filter((
            domNode: AnnotatedDomNode
        ): boolean =>
            !inputCandidates.some((
                otherDomNode: AnnotatedInputDomNode
            ): boolean =>
                domNode !== otherDomNode && otherDomNode.contains(domNode)
            )
        )

        // If no input is specified simply consider all provided inputs.
        const dummyMode: boolean =
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

        const missingInputs: Mapping<InputConfiguration> =
            {...this.inputConfigurations}

        this.determineInputNames()
        this.initialData = {}

        let index = 0
        /*
            Match all found inputs against existing specified fields or load
            not specified input into the specification (model configuration).
        */
        for (const domNode of inputs) {
            const name: null|string = domNode.getAttribute('name')
            if (name) {
                if (Object.prototype.hasOwnProperty.call(
                    this.inputConfigurations, name
                )) {
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

                const configuration: InputConfiguration =
                    this.inputConfigurations[name]

                if (
                    domNode.nodeName.includes('-') &&
                    Object.prototype.hasOwnProperty.call(
                        configuration.properties, 'value'
                    )
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

                        extend<RecursivePartial<Model>>(
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
                    delete configuration.properties.model.state

                    if (domNode.externalProperties?.model)
                        // Merge dom node and form model configurations.
                        extend<RecursivePartial<Model>>(
                            true,
                            configuration.properties.model,
                            domNode.externalProperties.model
                        )
                }

                /*
                    Sort known properties by known inter-dependencies and
                    unknown to ensure deterministic behavior.
                */
                type Key = keyof Partial<InputAnnotation>
                const sortedPropertyNames: Array<Key> =
                    (Object.keys(configuration.properties) as Array<Key>)
                        .sort((firstName: Key, secondName: Key): number => {
                            if (firstName === secondName)
                                return 0

                            const firstIndex: number =
                                this.self.knownPropertyOrdering.indexOf(
                                    firstName
                                )
                            const secondIndex: number =
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
                        !domNode.externalProperties ||
                        !Object.prototype.hasOwnProperty.call(
                            domNode.externalProperties, key
                        )
                    ) {
                        /*
                            NOTE: Explicit input specific model configuration
                            has higher priority than form specifications.
                        */
                        console.debug(
                            `Apply form configuration for input "${name}" ` +
                            `with property "${key}" and value "` +
                            `${represent(configuration.properties[key])}".`
                        )

                        ;(domNode[key as keyof InputAnnotation] as unknown) =
                            configuration.properties[key]
                    } else
                        console.debug(
                            `Form configuration for input "${name}" with ` +
                            `property "${key}" and value "` +
                            represent(configuration.properties[key]) +
                            '" has been shadowed by dom nodes configuration ' +
                            'value "' +
                            `${represent(domNode.externalProperties![key])}".`
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
                            get: (): unknown => configuration.domNode!.value,
                            set: (value: unknown): void => {
                                const tagName: string =
                                    domNode.nodeName.toLowerCase()

                                if (Object.prototype.hasOwnProperty.call(
                                    this.self.inputValueMapping, tagName
                                ))
                                    value = this.self.inputValueMapping[
                                        tagName
                                    ](value)

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
                    (
                        [null, undefined].includes(
                            domNode.initialValue as null
                        ) ||
                        [null, undefined].includes(
                            configuration.properties.default as null
                        ) ||
                        (
                            !configuration.properties.model ||
                            [null, undefined].includes(
                                configuration.properties.model.default as null
                            ) &&
                            [null, undefined].includes(
                                configuration.properties.model.value as null
                            )
                        )
                    )
                ) {
                    configuration.value =
                        configuration.properties.model?.value ??
                        configuration.properties.initialValue ??
                        domNode.initialValue ??
                        configuration.properties.default ??
                        configuration.properties.model?.default

                    await this.digest()

                    console.debug(
                        `Derive final initial value for input "${name}" to "` +
                        `${configuration.value as string}".`
                    )
                }

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
                Object.prototype.hasOwnProperty.call(
                    configuration, 'dependsOn'
                ) &&
                configuration.dependsOn === null
            )
                configuration.dependsOn = this.inputNames

        return missingInputs
    }
    /**
     * Whenever a component is re-configured a digest is needed to ensure that
     * its internal state has been reflected.
     * @param numberOfCycles - Number of digest cycles to wait until resolve
     * resulting promise.
     * @returns A promise resolving when digest hast been finished.
     */
    async digest(numberOfCycles = 1): Promise<void> {
        for (let cycle = 0; cycle < numberOfCycles; cycle += 1)
            await timeout()
    }
    /**
     * Finds all groups and connects them with their corresponding compiled
     * show if indicator functions. Additionally, some description will be
     * supplied.
     */
    setGroupSpecificConfigurations(): void {
        this.groups = []

        const groups: Array<AnnotatedDomNode> = Array.from(
            this.root.querySelectorAll(
                this.resolvedConfiguration.selector.groups
            )
        )

        const originalScopeNames: Array<string> =
            this.self.baseScopeNames.concat(
                'shownSubNodes',
                'subNodes',
                'visibility',
                this.evaluations.map(
                    (evaluation: Evaluation): string => evaluation[0]
                ),
                this.inputNames
            )

        // Determine all first level nested groups or input nodes.
        for (const domNode of groups) {
            const candidates: Array<AnnotatedDomNode> = groups.filter((
                otherDomNode: AnnotatedDomNode
            ): boolean =>
                domNode !== otherDomNode && domNode.contains(otherDomNode)
            )

            const specification: GroupSpecification = {
                childs: candidates.filter((domNode: AnnotatedDomNode): boolean =>
                    !candidates.some((otherDomNode: AnnotatedDomNode): boolean =>
                        otherDomNode !== domNode &&
                        otherDomNode.contains(domNode)
                    )
                ),
                showReason: null
            }

            specification.childs = specification.childs.concat(
                Object.values(this.inputConfigurations)
                    .map(({domNodes}): Array<AnnotatedInputDomNode> => domNodes)
                    .flat()
                    .filter((inputDomNode: AnnotatedInputDomNode): boolean =>
                        domNode.contains(inputDomNode) &&
                        !specification.childs.some(
                            (domNode: AnnotatedDomNode): boolean =>
                                domNode.contains(inputDomNode)
                        )
                    )
            )

            if (
                domNode.getAttribute('show-if') ||
                domNode.getAttribute('data-show-if')
            ) {
                const code: string = ((
                    domNode.getAttribute('show-if') ||
                    domNode.getAttribute('data-show-if')
                ) as string)
                    .replace(/(#039;)|(&amp;)/g, '&')
                    .replace(/<br\/>/g, '')

                let name = 'UNKNOWN'
                if (typeof domNode.getAttribute('data-name') === 'string')
                    name = domNode.getAttribute('data-name') as string
                if (typeof domNode.getAttribute('name') === 'string')
                    name = domNode.getAttribute('name') as string

                specification.showIfExpression = code

                const {error, scopeNames, templateFunction} =
                    compile(code, originalScopeNames)

                if (error)
                    console.error(
                        'Failed to compile "show-if" group expression ' +
                        `attribute "${name}": ${error}`
                    )
                else
                    specification.showIf = ((
                        shownSubNodes: Array<AnnotatedDomNode>,
                        subNodes: Array<AnnotatedDomNode>
                    ): boolean => {
                        try {
                            return Boolean(templateFunction(
                                this.actionResults,

                                this.determineStateURL,
                                this.determinedTargetURL,

                                this.getData,

                                this.initialResponse,
                                this.latestResponse,
                                this.response,

                                this.onceSubmitted,
                                this.pending,
                                this.invalid,
                                this.valid,
                                this.invalidConstraint,

                                this.queryParameters,

                                this.message,

                                ...UTILITY_SCOPE_VALUES,

                                shownSubNodes,
                                subNodes,
                                subNodes.length === 0 ||
                                shownSubNodes.length > 0,
                                ...this._evaluationResults,
                                ...this.inputNames.map((
                                    name: string
                                ): InputConfiguration =>
                                    this.inputConfigurations[name]
                                )
                            ))
                        } catch (error) {
                            console.error(
                                `Failed to evaluate group "${name}" code "` +
                                `${code}" with bound names "` +
                                `${scopeNames.join('", "')}": "` +
                                `${represent(error)}".`
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
     */
    createDependencyMapping(): void {
        this.dependencyMapping = {}

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        )) {
            if (!Object.prototype.hasOwnProperty.call(
                this.dependencyMapping, name
            ))
                this.dependencyMapping[name] = []

            if (configuration.dependsOn)
                for (const dependentName of ([] as Array<string>).concat(
                    configuration.dependsOn as Array<string>
                ))
                    if (Object.prototype.hasOwnProperty.call(
                        this.dependencyMapping, dependentName
                    )) {
                        if (!this.dependencyMapping[dependentName].includes(
                            name
                        ))
                            this.dependencyMapping[dependentName].push(name)
                    } else
                        this.dependencyMapping[dependentName] = [name]
        }
    }
    /// endregion
    /// region expression compiler
    /**
     * Pre-compiles specified given expression for given field.
     * @param name - Field name to pre-compile their expression.
     * @param type - Indicates which expression type should be compiled.
     */
    preCompileExpressions(name: string, type = 'transformer'): void {
        const typeName = `${type}Expression` as 'transformerExpression'

        const configuration: InputConfiguration = this.inputConfigurations[name]

        if (configuration[typeName]) {
            const code = configuration[typeName] as string
            const {error, scopeNames, templateFunction} = compile(
                code,
                this.self.baseScopeNames.concat(
                    'self',
                    'value',
                    this.evaluations.map(
                        (evaluation: Evaluation): string => evaluation[0]
                    ),
                    configuration.dependsOn || []
                )
            )

            if (error)
                console.error(
                    `Failed to compile "${typeName}" "${name}": ${error}`
                )

            configuration[type as 'transformer'] = (value: unknown): unknown => {
                try {
                    return templateFunction(
                        this.actionResults,

                        this.determineStateURL,
                        this.determinedTargetURL,

                        this.getData,

                        this.initialResponse,
                        this.latestResponse,
                        this.response,

                        this.onceSubmitted,
                        this.pending,
                        this.invalid,
                        this.valid,
                        this.invalidConstraint,

                        this.queryParameters,

                        this.message,

                        ...UTILITY_SCOPE_VALUES,

                        configuration,
                        value,
                        ...this._evaluationResults,
                        ...(configuration.dependsOn || [])
                            .map((name: string): InputConfiguration =>
                                this.inputConfigurations[name]
                            )
                    )
                } catch (error) {
                    console.warn(
                        `Failed running "${typeName}" "${code}" for field ` +
                        `field "${name}" with bound names "` +
                        `${scopeNames.join('", "')}": "${represent(error)}".`
                    )
                }

                return value
            }
        }
    }
    /**
     * Pre-compiles specified given dynamic extend expressions for given field.
     * @param name - Field name to pre-compile their expression.
     */
    preCompileDynamicExtendStructure(name: string): void {
        const configuration: InputConfiguration = this.inputConfigurations[name]

        if (!configuration.dynamicExtendExpressions)
            return

        configuration.dynamicExtend = {}
        for (const [subName, expression] of Object.entries(
            configuration.dynamicExtendExpressions
        )) {
            const code: ((event: Event, scope: unknown) => unknown)|string =
                expression

            const originalScopeNames: Array<string> =
                this.self.baseScopeNames.concat(
                    'event',
                    'eventName',
                    'scope',
                    'selfName',
                    'self',
                    this.evaluations.map(
                        (evaluation: Evaluation): string => evaluation[0]
                    ),
                    configuration.dependsOn || []
                )
            let scopeNames: Array<string>
            let templateFunction: TemplateFunction<unknown>

            if (typeof code === 'string') {
                const result: CompilationResult<unknown> =
                    compile<unknown>(code, originalScopeNames)

                scopeNames = result.scopeNames
                templateFunction = result.templateFunction

                if (result.error)
                    console.error(
                        `Failed to compile "dynamicExtendExpression" for ` +
                        `property "${subName}" in field "${name}":`,
                        result.error
                    )
            } else
                scopeNames = originalScopeNames.map((name: string): string =>
                    convertToValidVariableName(name)
                )

            configuration.dynamicExtend![subName] = (event: Event): unknown => {
                const scope: Mapping<unknown> = {}
                const context: Array<unknown> = [
                    this.actionResults,

                    this.determineStateURL,
                    this.determinedTargetURL,

                    this.getData,

                    this.initialResponse,
                    this.latestResponse,
                    this.response,

                    this.onceSubmitted,
                    this.pending,
                    this.invalid,
                    this.valid,
                    this.invalidConstraint,

                    this.queryParameters,

                    this.message,

                    ...UTILITY_SCOPE_VALUES,

                    event,
                    this.determineEventName(event),
                    scope,
                    name,
                    configuration,
                    ...this._evaluationResults,
                    ...(configuration.dependsOn || [])
                        .map((name: string): InputConfiguration =>
                            this.inputConfigurations[name]
                        )
                ]

                let index = 0
                for (const name of scopeNames) {
                    scope[name] = context[index]
                    index += 1
                }

                try {
                    return isFunction(code) ?
                        code(event, scope) :
                        templateFunction!(...context)
                } catch (error) {
                    console.error(
                        `Failed running "dynamicExtendExpression" "` +
                        `${code as string}" for property "${subName}" in ` +
                        `field "${name}" with bound names "` +
                        `${scopeNames.join('", "')}": "${represent(error)}".`
                    )
                }
            }
        }
    }
    /**
     * Pre-compiles all specified action expressions.
     */
    preCompileActions(): void {
        const originalScopeNames: Array<string> = this.self.baseScopeNames
            .concat(
                'event',
                'action',
                this.evaluations.map(
                    (evaluation: Evaluation): string => evaluation[0]
                ),
                this.inputNames
            )

        for (const [name, action] of Object.entries(
            this.resolvedConfiguration.actions
        )) {
            if (!action.name)
                action.name = name

            const code: string = action.code
            if (!action.run && code.trim() === 'fallback')
                continue

            const {error, scopeNames, templateFunction} =
                compile(code, originalScopeNames)
            if (error)
                console.error(
                    `Failed to compile action expression "${name}": ${error}`
                )

            action.run = async (event: Event, action: Action): Promise<void> => {
                try {
                    const result: unknown = templateFunction(
                        this.actionResults,

                        this.determineStateURL,
                        this.determinedTargetURL,

                        this.getData,

                        this.initialResponse,
                        this.latestResponse,
                        this.response,

                        this.onceSubmitted,
                        this.pending,
                        this.invalid,
                        this.valid,
                        this.invalidConstraint,

                        this.queryParameters,

                        this.message,

                        ...UTILITY_SCOPE_VALUES,

                        event,
                        action,

                        ...this._evaluationResults,
                        ...this.inputNames.map((
                            name: string
                        ): InputConfiguration => this.inputConfigurations[name])
                    )

                    this.actionResults[name] =
                        result !== null &&
                        typeof result === 'object' &&
                        'then' in (result as Promise<unknown>) ?
                            await (result as Promise<unknown>) :
                            result
                } catch (error) {
                    console.error(
                        `Failed running action "${name}" expression "${code}` +
                        `" with bound names "${scopeNames.join('", "')}": "` +
                        `${represent(error)}".`
                    )
                }
            }
        }
    }
    /**
     * Pre-compiles all specified target action expressions.
     */
    preCompileTargetActions(): void {
        const originalScopeNames: Array<string> = this.self.baseScopeNames
            .concat(
                this.evaluations.map(
                    (evaluation: Evaluation): string => evaluation[0]
                ),
                this.inputNames
            )

        for (const [name, action] of Object.entries(
            this.resolvedConfiguration.targetActions
        )) {
            if (!action.name)
                action.name = name

            const code: string = action.code
            if (!action.indicator && code.trim() === 'fallback')
                continue

            const {error, scopeNames, templateFunction} =
                compile(code, originalScopeNames)
            if (error)
                console.error(
                    `Failed to compile target action expression "${name}":`,
                    error
                )

            action.indicator = (): unknown => {
                try {
                    return templateFunction(
                        this.actionResults,

                        this.determineStateURL,
                        this.determinedTargetURL,

                        this.getData,

                        this.initialResponse,
                        this.latestResponse,
                        this.response,

                        this.onceSubmitted,
                        this.pending,
                        this.invalid,
                        this.valid,
                        this.invalidConstraint,

                        this.queryParameters,

                        this.message,

                        ...UTILITY_SCOPE_VALUES,

                        ...this._evaluationResults,
                        ...this.inputNames.map((
                            name: string
                        ): InputConfiguration => this.inputConfigurations[name])
                    )
                } catch (error) {
                    console.error(
                        `Failed running target action "${name}" expression "` +
                        `${code}" with bound names "` +
                        `${scopeNames.join('", "')}": "${represent(error)}".`
                    )
                }
            }
        }
    }
    /**
     * Pre-compiles all specified generic evaluations.
     */
    preCompileGenericEvaluations(): void {
        this.evaluations = []

        const names: Array<string> =
            this.evaluations.map((evaluation: Evaluation): string =>
                evaluation[0]
            )

        for (
            const evaluation of this.resolvedConfiguration.evaluations as
                Array<Evaluation>
        ) {
            const [name, code] = evaluation

            if (typeof code !== 'string') {
                this.evaluations.push([name, code])
                names.push(name)

                continue
            }

            const {error, scopeNames, templateFunction} = compile(
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

            this.evaluations.push([name, (): unknown => {
                try {
                    return templateFunction(
                        this.actionResults,

                        this.determineStateURL,
                        this.determinedTargetURL,

                        this.getData,

                        this.initialResponse,
                        this.latestResponse,
                        this.response,

                        this.onceSubmitted,
                        this.pending,
                        this.invalid,
                        this.valid,
                        this.invalidConstraint,

                        this.queryParameters,

                        this.message,

                        ...UTILITY_SCOPE_VALUES,

                        ...this._evaluationResults,
                        ...this.inputNames.map(
                            (name: string): InputConfiguration =>
                                this.inputConfigurations[name]
                        )
                    )
                } catch (error) {
                    console.error(
                        `Failed running generic expression "${name}" ` +
                        `"${code}" with bound names "` +
                        `${scopeNames.join('", "')}": "${represent(error)}"`
                    )
                }
            }])
        }
    }
    /**
     * Pre-compiles all specified expressions given by the current
     * configuration.
     */
    preCompileConfigurationExpressions() {
        this.preCompileGenericEvaluations()
        this.preCompileActions()
        this.preCompileTargetActions()

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
    /// endregion
    /// region initialize/submit/reset actions
    /**
     * Determines simple scope for partial configuration evaluations.
     * @returns Scope.
     */
    determineEvaluationScope(): Mapping<unknown> {
        return {
            ...UTILITY_SCOPE,
            determineStateURL: this.determineStateURL,
            queryParameters: this.queryParameters,

            ...Object.fromEntries(
                this.evaluations
                    .map((evaluation: Evaluation): string => evaluation[0])
                    .map((name: string, index: number): [string, unknown] =>
                        [name, this._evaluationResults[index]]
                    )
            ),

            ...Object.fromEntries(this.inputNames.map(
                (name: string): [string, InputConfiguration] =>
                    [name, this.inputConfigurations[name]]
            )),

            ...this.resolvedConfiguration
        }
    }
    /**
     * Can be triggered vie provided action condition. Can for example retrieve
     * initial user specific state depending on remote response.
     * @returns Promise resolving to nothing when initial request has been
     * done.
     */
    async initialize(): Promise<void> {
        this.triggerEvent(
            'initialize',
            {reference: this.resolvedConfiguration.initializeTarget}
        )

        if (this.resolvedConfiguration.initializeTarget?.url) {
            /*
                NOTE: We have to start background process (run evaluations)
                before rendering initial target to have corresponding
                environment available.
            */
            const detail: {target: null|TargetConfiguration} = {target: null}

            const event: Event = new CustomEvent('initialize', {detail})

            await this.startBackgroundProcess(event)

            detail.target = evaluateDynamicData(
                copy(this.resolvedConfiguration.initializeTarget),
                this.determineEvaluationScope()
            )

            if (detail.target.url) {
                this.initialResponse =
                    this.latestResponse =
                    await this.doRequest(detail.target)

                if (!this.initialResponse) {
                    await this.stopBackgroundProcess(event)

                    return
                }

                if (Object.prototype.hasOwnProperty.call(
                    this.resolvedConfiguration.targetActions, 'initialize'
                )) {
                    this.runEvaluations()

                    const target: null|string = this.resolveTargetAction(
                        this.resolvedConfiguration.targetActions.initialize,
                        'initialize'
                    )

                    if (typeof target === 'string') {
                        location.href = target

                        this.triggerEvent(
                            'initialized', {target: detail.target}
                        )

                        return
                    }
                }
            }

            if (this.pending)
                await this.stopBackgroundProcess(event)

            this.triggerEvent('initialized', {target: detail.target})
        }
    }
    /**
     * Resolve target action.
     * @param action - Action to resolve.
     * @param name - Action description.
     * @returns A target action url result or undefined.
     */
    resolveTargetAction(action: TargetAction, name: string): null|string {
        const actionResult: unknown = action.indicator()
        if (actionResult) {
            console.debug(
                `Action "${name}" matched` +
                (
                    typeof actionResult === 'boolean' ?
                        '' :
                        ` (with result "${actionResult as string}")`
                ) +
                '.'
            )

            let target: string = action.target
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
                        `${target.includes('?') ? '&' : '?'}${actionResult}`

            return target
        }

        return null
    }
    //// region event handler
    /**
     * Sets all given input fields to their corresponding default values.
     * @param event - Triggered event object.
     */
    onClear = (event: MouseEvent) => {
        void this.doReset(event, true)
    }
    /**
     * Callback triggered when any keyboard events occur.
     * Enter key down events in input fields trigger a form submit.
     * @param event - Keyboard event object.
     */
    onKeyDown = (event: KeyboardEvent) => {
        if (
            KEYBOARD_CODES.ENTER === event.code &&
            (event.target as HTMLElement|null)?.closest
        ) {
            const inputTarget: HTMLElement|null =
                (event.target as HTMLElement).closest(
                    this.resolvedConfiguration.selector.inputs
                )
            if (inputTarget && this.root.contains(inputTarget))
                this.onSubmit(event)
        }
    }
    /**
     * Sets all given input fields to their corresponding initial values.
     * @param event - Triggered event object.
     */
    onReset = (event: MouseEvent) => {
        void this.doReset(event, false)
    }
    /**
     * Triggers form submit.
     * @param event - Triggered event object.
     */
    onSubmit = (event: KeyboardEvent|MouseEvent) => {
        void this.doSubmit(event)
    }
    /**
     * Clears all given input fields.
     * @param event - Triggered event object.
     */
    onTruncate = (event: MouseEvent) => {
        void this.doReset(event)
    }
    //// endregion
    /**
     * Sets all given input fields to their initial value.
     * @param event - Triggered event object.
     * @param useDefault - Indicates to use default value while resetting.
     * @returns A promise resolving to nothing.
     */
    doReset = async (
        event: MouseEvent, useDefault: boolean|null = null
    ): Promise<void> => {
        event.preventDefault()
        event.stopPropagation()

        for (const name of Object.keys(this.inputConfigurations))
            try {
                await this.resetInput(name, useDefault)
            } catch (error) {
                console.warn(
                    `Failed to reset input "${name}": ` +
                    represent(error)
                )
            }
    }
    /**
     * Sets given input field their initial value.
     * @param name - Name of the field to clear.
     * @param useDefault - Indicates to use default value while resetting.
     * @returns A promise resolving to a boolean indicating whether provided
     * field name exists.
     */
    async resetInput(
        name: string, useDefault: boolean|null = false
    ): Promise<boolean> {
        if (Object.prototype.hasOwnProperty.call(
            this.inputConfigurations, name
        )) {
            const configuration: InputConfiguration =
                this.inputConfigurations[name]

            if (
                useDefault === false &&
                Object.prototype.hasOwnProperty.call(this.initialData, name)
            )
                for (const domNode of configuration.domNodes)
                    domNode.value = copy(this.initialData[name])
            else if (
                useDefault &&
                Object.prototype.hasOwnProperty.call(
                    configuration.properties, 'default'
                )
            )
                for (const domNode of configuration.domNodes)
                    domNode.value = copy(configuration.properties.default)
            else
                for (const domNode of configuration.domNodes)
                    domNode.value = null

            await this.digest()

            return true
        }

        return false
    }
    /// endregion
    /**
     * Calculates current document relative offset of given dom node's
     * position.
     * @param domNode - Target node to calculate from.
     * @returns Calculated values.
     */
    getOffset(domNode: AnnotatedDomNode): Offset {
        const documentNode: HTMLElement = document.documentElement
        const box: ReturnType<HTMLElement['getBoundingClientRect']> =
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
     * @returns A promise resolving when focusing has finished.
     */
    scrollAndFocus(
        targetDomNode: AnnotatedDomNode, smooth = true
    ): Promise<void> {
        return new Promise<void>((resolve: () => void): void => {
            const offset: Offset = this.getOffset(targetDomNode)
            const newScrollPosition: number = Math.max(
                0, offset.top - this.resolvedConfiguration.offsetInPixel
            )

            const onScroll = (): void => {
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

            if (
                MAXIMAL_SUPPORTED_INTERNET_EXPLORER_VERSION.value === 0 &&
                smooth
            )
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
    /// region form submission
    /**
     * Sets all hidden non-persistent input fields to their initial value.
     * @returns A promise resolving to nothing.
     */
    async resetAllHiddenNonPersistentInputs(): Promise<void> {
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
    getData = (): ResponseResult => {
        const data: Mapping<unknown> = {}
        const invalidInputNames: Array<string> = []

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        ))
            if (!name.includes('.')) {
                const value: unknown =
                    configuration.transformer ?
                        configuration.transformer!(configuration.value) :
                        configuration.value

                if (configuration.shown && configuration.domNode?.invalid)
                    invalidInputNames.push(name)

                if (name && ![null, undefined].includes(value as null))
                    if (
                        typeof value === 'object' &&
                        Object.prototype.hasOwnProperty.call(
                            configuration, 'dataMapping'
                        )
                    ) {
                        const scope: Mapping<unknown> = {
                            ...value,
                            data,
                            inputConfigurations: this.inputConfigurations,
                            name,
                            item: value
                        }

                        if (typeof configuration.dataMapping === 'string') {
                            const evaluated: EvaluationResult = evaluate(
                                configuration.dataMapping as string, scope
                            )

                            if (evaluated.error)
                                throw new Error(evaluated.error)

                            data[name] = evaluated.result
                        } else
                            for (const [subName, expression] of Object.entries(
                                configuration.dataMapping as Mapping
                            )) {
                                const evaluated: EvaluationResult =
                                    evaluate(expression, scope)

                                if (evaluated.error)
                                    throw new Error(evaluated.error)

                                data[subName] = evaluated.result
                            }
                    } else if (Array.isArray(value))
                        if (value.every((item: unknown): boolean =>
                            item !== null &&
                            typeof item === 'object' &&
                            item &&
                            Object.prototype.hasOwnProperty.call(item, 'value')
                        ))
                            data[name] =
                                value.map((item: {value: unknown}): unknown =>
                                    item!.value
                                )
                        else
                            data[name] = value
                    else
                        data[name] = value
            }

        return {data, invalidInputNames}
    }
    /**
     * Sets global validation message and scrolls to first invalid field.
     * @param data - Data given by the form.
     * @param invalidInputNames - All currently invalid fields names.
     */
    handleInvalidSubmittedInput(
        data: Mapping<unknown>, invalidInputNames: Array<string>
    ) {
        this.updateMessageBox(
            'The following inputs are invalid "' +
            `${invalidInputNames.join('", "')}".`
        )

        const invalidInputs: Array<AnnotatedInputDomNode> = Array.from(
            this.root.querySelectorAll(
                `[name="${invalidInputNames.join('"], [name="')}"]`
            )
        )

        if (invalidInputs.length)
            void this.scrollAndFocus(invalidInputs[0])
    }
    /**
     * Handle valid sent data and redirects to corresponding specified target
     * page.
     * @param data - Data given by the form.
     * @param newWindow - Indicates whether action targets should be opened in
     * a new window.
     * @returns Redirection target.
     */
    handleValidSentData(data: Mapping<unknown>, newWindow = false): string {
        this.triggerEvent(
            'submitSuccessful',
            {reference: {request: data, response: this.response!.data}}
        )

        let redirected = false
        let fallbackTarget = ''

        this.runEvaluations()

        for (const [name, action] of Object.entries(
            this.resolvedConfiguration.targetActions
        ))
            if (name !== 'initialize')
                if (action.code === 'fallback')
                    fallbackTarget = action.target.trim()
                else {
                    const target: null|string =
                        this.resolveTargetAction(action, name)

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
     * @param rawData - Data given by the form.
     */
    handleUnsuccessfulSentRequest(
        response: FormResponse, rawData: null|PlainObject
    ): void {
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
                void this.scrollAndFocus(
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
     * information for triggered request.
     * @returns A promise wrapping the response.
     */
    async doRequest(
        target: TargetConfiguration, rawData: null|PlainObject = null
    ): Promise<null|FormResponse> {
        // region convert headers configuration to header object
        if (
            window.Headers &&
            Object.prototype.hasOwnProperty.call(target, 'options') &&
            target.options !== null &&
            Object.prototype.hasOwnProperty.call(target.options, 'headers') &&
            target.options.headers !== null
        ) {
            const headers: Headers = new Headers()
            if (!(target.options.headers instanceof Headers))
                for (const [name, header] of Object.entries(
                    target.options.headers as Mapping
                ))
                    if (
                        ['boolean', 'number', 'string'].includes(
                            typeof header
                        ) &&
                        `${header}`.trim()
                    )
                        headers.set(name, header)

            target.options.headers = headers
        }
        // endregion

        if (target.options?.body && typeof target.options.body !== 'string')
            target.options.body = JSON.stringify(target.options.body)

        let response: null|FormResponse = null

        void this.updateReCaptchaToken()

        try {
            response = await fetch(target.url, target.options || {}) as
                unknown as
                FormResponse
        } catch (error) {
            const statusText: string = represent(error)

            console.warn(`Could not request "${target.url}" "${statusText}".`)

            response = {
                ...target.options,
                data: {},
                headers: new Headers(),
                ok: false,
                redirected: false,
                status: 0,
                statusText,
                url: target.url
            } as
                unknown as
                FormResponse
        }

        try {
            let responseString: string = await (response as FormResponse).text()
            if (responseString.startsWith(
                this.resolvedConfiguration.securityResponsePrefix
            ))
                responseString = responseString.substring(
                    this.resolvedConfiguration.securityResponsePrefix.length
                )

            response!.data = JSON.parse(responseString) as PlainObject
            response!.data = getSubstructure(
                (response as FormResponse).data,
                this.resolvedConfiguration.responseDataWrapperSelector.path,
                this.resolvedConfiguration.responseDataWrapperSelector.optional
            )
        } catch (error) {
            console.warn(
                `Given response could not be interpret as json "` +
                `${represent(error)}".`
            )
        }

        if (response) {
            if (response.ok && response.data) {
                if (
                    response.data.result &&
                    [401, 403, 407].includes(response.status)
                )
                    // NOTE: We have an unauthenticated request.
                    this.triggerEvent(
                        'serverAuthenticationInvalid',
                        {reference: {
                            request: rawData,
                            response: response.data
                        }}
                    )

                return response
            }

            this.handleUnsuccessfulSentRequest(response, rawData)
        }

        return response
    }
    /**
     * Send given data to server und interpret response.
     * @param event - Triggering event object.
     * @param data - Valid data given by the form.
     * @param newWindow - Indicates whether action targets should be opened in
     * a new window.
     * @returns Promise holding nothing.
     */
    async handleValidSubmittedInput(
        event: Event, data: Mapping<unknown>, newWindow = false
    ): Promise<void> {
        this.triggerEvent('validSubmit', {reference: data})
        // region prepare request
        this.runEvaluations()

        this.resolvedConfiguration.data = data
        this.resolvedConfiguration.targetData = this.mapTargetNames(data)
        const target: null|TargetConfiguration = evaluateDynamicData(
            copy(this.resolvedConfiguration.target),
            this.determineEvaluationScope()
        )
        // endregion
        if (target?.url) {
            this.determinedTargetURL = target.url

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
                console.debug('Retrieved data:', represent(data))
        }

        await this.stopBackgroundProcess(event)
    }
    /**
     * Maps given field names to endpoint's expected ones.
     * @param data - To transform.
     * @returns Resulting transformed data.
     */
    mapTargetNames(data: Mapping<unknown>): Mapping<unknown> {
        const result: Mapping<unknown> = {}

        for (const [name, value] of Object.entries(data))
            if (
                Object.prototype.hasOwnProperty.call(
                    this.inputConfigurations, name
                ) &&
                Object.prototype.hasOwnProperty.call(
                    this.inputConfigurations[name], 'target'
                )
            ) {
                if (
                    typeof this.inputConfigurations[name].target ===
                        'string' &&
                    (this.inputConfigurations[name].target as string).length
                )
                    result[this.inputConfigurations[name].target as string] =
                        value
            } else
                result[name] = value

        return result
    }
    /**
     * Check validation state of all content projected inputs, represents
     * overall validation state and sends data to configured target.
     * @param event - Triggered event object.
     */
    doSubmit = async (event: KeyboardEvent|MouseEvent): Promise<void> => {
        try {
            event.preventDefault()
            event.stopPropagation()

            if (this.submitted || this.pending)
                return

            this.invalid = true
            this.invalidConstraint = null
            this.valid = !this.invalid

            const target: HTMLElement|null = this.submitButtons.length ?
                this.submitButtons[0] :
                event.target as HTMLElement
            const newWindow: boolean = target ?
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
                for (const {domNodes} of Object.values(
                    this.inputConfigurations
                ))
                    for (const domNode of domNodes)
                        domNode.showInitialValidationState = true
                this.handleInvalidSubmittedInput(data, invalidInputNames)
            } else if (
                this.reCaptchaFallbackRendered &&
                this.reCaptchaFallbackInput!.hasAttribute('invalid')
            ) {
                this.updateMessageBox('Please do the re-captcha challenge.')

                void this.scrollAndFocus(
                    this.reCaptchaFallbackInput as AnnotatedDomNode
                )
            } else {
                this.resolvedConfiguration.reCaptcha.token =
                    (await this.reCaptchaPromise) || ''

                this.onceSubmitted = this.submitted = true

                this.invalid = false
                this.valid = !this.invalid

                const fieldValues: Array<InputConfiguration> =
                    this.inputNames.map((name: string): InputConfiguration =>
                        this.inputConfigurations[name]
                    )
                const values: Array<unknown> = [
                    this.actionResults,

                    this.determineStateURL,
                    this.determinedTargetURL,

                    this.getData,

                    this.initialResponse,
                    this.latestResponse,
                    this.response,

                    this.onceSubmitted,
                    this.pending,
                    this.invalid,
                    this.valid,
                    this.invalidConstraint,

                    this.queryParameters,

                    this.message,

                    ...UTILITY_SCOPE_VALUES,

                    ...fieldValues
                ]
                const scope: Mapping<unknown> = this.self.baseScopeNames
                    .concat(this.inputNames)
                    .reduce(
                        (
                            scope: Mapping<unknown>,
                            name: string,
                            index: number
                        ): Mapping<unknown> => {
                            scope[name] = values[index]
                            return scope
                        },
                        {}
                    )

                for (
                    const constraint of this.resolvedConfiguration.constraints
                ) {
                    const evaluatedConstraint: EvaluationResult =
                        evaluate(constraint.evaluation, scope)
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
            console.warn(`Submitting failed: ${represent(error)}`)
        }
    }
    /// endregion
    /// region inter component interaction
    /**
     * Add all needed field event listener to trigger needed checks and start
     * dependent field change cascade.
     */
    applyInputBindings(): void {
        const scope: (
            typeof UTILITY_SCOPE &
            {
                instance: AgileForm
                name: string
            }
        ) = {...UTILITY_SCOPE, instance: this, name: 'UNKNOWN_NAME'}

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        )) {
            scope.name = name
            for (const domNode of configuration.domNodes)
                this.applyBindings(domNode, scope)

            if (!Object.prototype.hasOwnProperty.call(
                this.inputEventBindings, name
            )) {
                const eventName: string =
                    Object.prototype.hasOwnProperty.call(
                        configuration, 'changedEventName'
                    ) ?
                        configuration.changedEventName as string :
                        'change'

                const handler: EventListener = debounce<void>(
                    (async (event: Event): Promise<void> => {
                        await this.digest()

                        let lock: Lock

                        // NOTE: We update input dom node if it has changed.
                        if (event.target)
                            /*
                                NOTE: We have to check that we do not grab an
                                internal input node if there is already a
                                wrapping one registered.
                            */
                            if (!this.inputConfigurations[name].domNode) {
                                this.inputConfigurations[name].domNode =
                                    event.target as AnnotatedInputDomNode
                                this.inputConfigurations[name].domNodes.push(
                                    event.target as AnnotatedInputDomNode
                                )
                            } else if (!Object.values(this.inputConfigurations)
                                .map((
                                    {domNodes}
                                ): Array<AnnotatedInputDomNode> => domNodes)
                                .flat()
                                .some((
                                    inputDomNode: AnnotatedInputDomNode
                                ): boolean =>
                                    inputDomNode.contains(
                                        event.target as AnnotatedInputDomNode
                                    )
                                )
                            )
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
                ) as EventListener

                for (const domNode of this.inputConfigurations[name].domNodes)
                    domNode.addEventListener(eventName, handler)

                this.inputEventBindings[name] = () => {
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
     * @returns Promise holding nothing.
     */
    async updateAllInputs(event: Event): Promise<void> {
        for (const name of Object.keys(this.inputConfigurations))
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
    async updateInput(name: string, event: Event): Promise<boolean> {
        this.runEvaluations()

        const configuration: InputConfiguration = this.inputConfigurations[name]
        // We have to check for real state changes to avoid endless loops.
        let changed = false
        if (Object.prototype.hasOwnProperty.call(
            configuration, 'dynamicExtend'
        ))
            for (const [selector, evaluator] of Object.entries(
                configuration.dynamicExtend as
                    Mapping<(event: Event) => unknown>
            )) {
                let invert = false
                let mappedSelector: string = selector
                if (Object.prototype.hasOwnProperty.call(
                    this.self.specificationToPropertyMapping, selector
                )) {
                    invert = Boolean(
                        this.self.specificationToPropertyMapping[selector]
                            .invert
                    )
                    mappedSelector =
                        this.self.specificationToPropertyMapping[selector].name
                }

                const index: number = mappedSelector.lastIndexOf('.')

                const path: Array<string>|string =
                    index > 0 ? mappedSelector.substring(0, index) : []
                const key: string = index > 0 ?
                    mappedSelector.substring(index + 1) :
                    mappedSelector

                const target: Mapping<unknown> =
                    getSubstructure(configuration.properties, path)

                const oldValue: unknown = target[key]

                let newValue: unknown = evaluator(event)

                if (invert)
                    newValue = !newValue

                if (oldValue !== newValue) {
                    changed = true

                    if (mappedSelector !== 'value')
                        target[key] = newValue

                    console.debug(
                        `Change "${selector}" on "${name}" from "` +
                        `${oldValue as string}" to "${newValue as string}".`
                    )

                    getSubstructure<
                        Partial<InputAnnotation>, Mapping<unknown>
                    >(configuration.properties, path)[key] = newValue
                    for (const domNode of configuration.domNodes)
                        getSubstructure<
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
     * @param event - Triggering event.
     * @returns Promise holding nothing.
     */
    async updateInputDependencies(name: string, event: Event): Promise<void> {
        for (const dependentName of this.dependencyMapping[name])
            await this.updateInput(dependentName, event)
    }
    /**
     * Trigger inputs internal change detection.
     * @param name - Field name to update their model.
     * @returns A promise resolving to nothing.
     */
    async triggerModelUpdate(name: string): Promise<void> {
        if (Object.prototype.hasOwnProperty.call(
            this.inputConfigurations, name
        ))
            for (const domNode of this.inputConfigurations[name].domNodes) {
                if (typeof domNode.changeTrigger === 'function') {
                    const result: unknown =
                        (domNode.changeTrigger as () => void)()

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
    /// endregion
    /// region utility
    /**
     * Derives event name from given event.
     * @param event - Event to derive name from.
     * @returns Derived name.
     */
    determineEventName(
        event: Event & {detail?: {
            parameter?: Array<{type?: string}>
            type?: string
        }}
    ): string {
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
     */
    runEvaluations() {
        this._evaluationResults = []

        for (const evaluation of this.evaluations)
            this._evaluationResults.push(
                isFunction(evaluation[1]) ?
                    evaluation[1]() :
                    evaluation[1]
            )
    }
    /**
     * Indicates a background running process. Sets "pending" property and
     * triggers a loading spinner.
     * @param event - Triggering event object.
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async startBackgroundProcess(event: Event): Promise<void> {
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
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    async stopBackgroundProcess(event: Event): Promise<void> {
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
     * @returns A boolean indicating the neediness.
     */
    isDeterminedStateValueNeeded(name: string): boolean {
        const domNode: AnnotatedInputDomNode|undefined =
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
    determineStateURL = (): StateURL => {
        const parameter: NormalizedConfiguration =
            this.self.normalizeConfiguration(this.urlConfiguration || {})

        if (!isPlainObject(parameter.inputs))
            parameter.inputs = {}

        for (const [name, configuration] of Object.entries(
            this.inputConfigurations
        ))
            if (
                !name.includes('.') &&
                configuration.domNode &&
                (
                    configuration.domNode.dirty ||
                    /*
                        NOTE: This input seems to have limited input state
                        support, so we have to consider this.
                    */
                    configuration.domNode.dirty !== false &&
                    (
                        configuration.domNode.constructor as
                            unknown as
                            StaticWebComponent
                    ).webComponentAdapterWrapped !== 'react'
                )
            ) {
                /*
                    NOTE: Initial values derived from existing state url
                    shouldn't be a problem because of the prior condition.
                */
                let serializedValue: unknown = null
                let useValue = false
                if (this.isDeterminedStateValueNeeded(name)) {
                    serializedValue = configuration.serializer ?
                        configuration.serializer!(
                            configuration.value
                        ) :
                        configuration.value
                    useValue =
                        JSON.stringify(serializedValue).length <
                        this.resolvedConfiguration
                            .urlConfigurationCharacterLimit
                }

                if (Object.prototype.hasOwnProperty.call(
                    parameter.inputs, name
                )) {
                    if (!(
                        parameter.inputs[name as keyof Model] &&
                        Object.prototype.hasOwnProperty.call(
                            parameter.inputs[name as keyof Model], 'properties'
                        )
                    ))
                        parameter.inputs[name as keyof Model]!.properties = {}

                    if (
                        this.inputConfigurations[name].value !==
                        parameter.inputs[name as keyof Model]!.properties!
                            .value
                    )
                        if (useValue)
                            parameter.inputs[name]!.properties!.value =
                                serializedValue
                        else {
                            delete parameter.inputs[name]!.properties!.value

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
                } else if (useValue && this.isDeterminedStateValueNeeded(name))
                    parameter.inputs[name] = {
                        properties: {value: serializedValue}
                    }
            }

        if (parameter.evaluations.length === 0)
            delete (parameter as Partial<NormalizedConfiguration>).evaluations

        if (parameter.tag.values.length === 0)
            delete (parameter.tag as Partial<NormalizedConfiguration['tag']>)
                .values
        if (Object.keys(parameter.tag).length === 0)
            delete (parameter as Partial<NormalizedConfiguration>).tag

        // Use only allowed configuration fields.
        const maskedParameter: RecursivePartial<NormalizedConfiguration> =
            mask<NormalizedConfiguration>(
                parameter, this.resolvedConfiguration.urlConfigurationMask
            )

        if (
            maskedParameter.inputs &&
            Object.keys(maskedParameter.inputs).length === 0
        )
            delete maskedParameter.inputs

        const result: StateURL = {
            encoded: document.URL, plain: decodeURI(document.URL)
        }
        if (Object.keys(maskedParameter).length) {
            for (const [key, value] of Object.entries(result))
                result[key as keyof StateURL] = (value as string)
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
            const allKeys: Array<string> = []
            const seenKeys: Mapping<null> = {}
            // First just determine all available keys.
            JSON.stringify(
                maskedParameter,
                (key: string, value: unknown): unknown => {
                    if (!Object.prototype.hasOwnProperty.call(seenKeys, key)) {
                        allKeys.push(key)
                        seenKeys[key] = null
                    }

                    return value
                }
            )
            allKeys.sort()
            // Now do the real serializing job.
            const value: string = JSON.stringify(maskedParameter, allKeys, '')

            const encodedQueryParameter =
                `${this.resolvedConfiguration.name}=` +
                encodeURIComponent(value)
            const queryParameter =
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
     * @returns "false" if event is cancelable, and at least one of the event
     * handlers which received event called "Event.eventDefault()" and "true"
     * otherwise.
     */
    triggerEvent(name: string, data: Mapping<unknown>): boolean {
        /*
            NOTE: We should forward runtime data to avoid unexpected behavior
            if gtm or configured tracking tool manipulates given data.
        */
        if (Object.prototype.hasOwnProperty.call(data, 'reference'))
            data.reference = copy(data.reference)

        return this.dispatchEvent(new CustomEvent(name, {detail: data}))
    }
    /**
     * Renders user interaction re-captcha version if corresponding placeholder
     * is available.
     * @returns A boolean indicating if a fallback node was found to render.
     */
    updateReCaptchaFallbackToken(): boolean {
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
                new Promise((resolve: (result: null|string) => void) => {
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
                        callback: (token: string): void => {
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
        }

        this.reCaptchaPromise = Promise.resolve(null)

        return false
    }
    /**
     * Updates internal saved re-captcha token.
     * @returns Promise resolving to challenge token or null if initialisation
     * was unsuccessful.
     */
    updateReCaptchaToken(): Promise<null|string> {
        if (this.reCaptchaFallbackRendered) {
            this.updateReCaptchaFallbackToken()

            return Promise.resolve(null)
        }

        if (this.reCaptchaToken) {
            // NOTE: If called second time reset initializing promise.
            this.reCaptchaToken = null
            this.reCaptchaPromise =
                new Promise((resolve: (result: null|string) => void) => {
                    this.reCaptchaPromiseResolver = resolve
                })
        }

        if (
            window.grecaptcha &&
            this.resolvedConfiguration.reCaptcha?.key?.v3 &&
            (this.resolvedConfiguration.target as TargetConfiguration)?.url
        )
            try {
                window.grecaptcha!.ready((): void => {
                    window.grecaptcha.execute(
                        this.resolvedConfiguration.reCaptcha.key.v3,
                        this.resolvedConfiguration.reCaptcha.action
                    ).then(
                        (token: string) => {
                            this.reCaptchaToken = token
                            this.reCaptchaPromiseResolver(this.reCaptchaToken)
                        },
                        () => {
                            this.reCaptchaToken = null
                            this.reCaptchaPromiseResolver(this.reCaptchaToken)
                        }
                    )
                })
            } catch (error) {
                console.warn(
                    `Could not retrieve a re-captcha token: "` +
                    `${represent(error)}".`
                )
            }
        else {
            this.reCaptchaToken = null
            this.reCaptchaPromiseResolver(this.reCaptchaToken)
        }

        return this.reCaptchaPromise
    }
    /// endregion
    // endregion
}
// endregion
export const api: WebComponentAPI<typeof AgileForm> = {
    component: AgileForm,
    register: (
        tagName: string = camelCaseToDelimited(AgileForm._name)
    ) => {
        customElements.define(tagName, AgileForm)
    }
}
export default api
