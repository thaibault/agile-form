import type { Mapping, Offset, PlainObject, QueryParameters, RecursiveEvaluateable, RecursivePartial } from 'clientnode';
import type { WebComponentAPI } from 'web-component-wrapper/type';
import type { AnnotatedDomNode, Configuration, Constraint, Evaluation, FormResponse, GivenEvaluations, GroupSpecification, InputConfiguration, InputUpdateCascade, NormalizedConfiguration, ResponseResult, StateURL, TargetAction, TargetConfiguration } from './type';
import { Lock, Logger } from 'clientnode';
import Web from 'web-component-wrapper/Web';
export declare const log: Logger;
/**
 * Form handler which accepts a various number of content projected dom nodes
 * to interact with them following a given specification object.
 * @property baseScopeNames - List of generic scope names available in all
 * evaluation environments.
 * @property defaultConfiguration - Holds default extendable configuration
 * object.
 * @property specificationToPropertyMapping - Mapping model specification keys
 * to their corresponding input field property name (if not equal).
 * @property knownPropertyOrdering - Order of known properties to apply on
 * inputs.
 * @property scrollAndFocusTimeoutInMilliseconds - Maximum time to wait for a
 * smooth scroll to end before focusing anyway.
 * @property maximumNumberOfInputChangesPerUpdate - Maximum number of input
 * changes a single update may cascade into before it is stopped (to avoid
 * endless loops of inputs changing each other).
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
 * @property initialResponse - Initialization server response.
 * @property latestResponse - Last seen server response.
 * @property message - Current error message about unsatisfied given
 * specification.
 * @property response - Current parsed response from send form data.
 * @property inputEventBindings - Holds a mapping from nodes with registered
 * event handlers mapped to their deregistration function.
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
 * @property reCaptchaPromise - Reference to re-captcha initialization promise.
 * @property reCaptchaPromiseResolver - Reference to re-captcha initialization.
 * @property reCaptchaToken - Last challenge result token promise resolver.
 * @property additionalConfiguration - Holds given configuration object.
 * @property baseConfiguration - Holds given configuration object.
 * @property configuration - Holds given configuration object.
 * @property dynamicConfiguration - Holds given configuration object.
 * @property resolvedConfiguration - Holds given configuration object.
 * @property urlConfiguration - URL given configurations object.
 * @property queryParameters - All determined query parameters.
 * @property lock - Holds lock instance for saving instance-specific locks.
 * @property _evaluationResults - Last known evaluation result cache.
 */
export declare class AgileForm<TElement = HTMLElement, ExternalProperties extends Mapping<unknown> = Mapping<unknown>, InternalProperties extends Mapping<unknown> = Mapping<unknown>, EvaluationScope extends Mapping<unknown> = Mapping<unknown>> extends Web<TElement, ExternalProperties, InternalProperties> {
    static baseScopeNames: string[];
    static content: string;
    static defaultConfiguration: RecursiveEvaluateable<Configuration>;
    static doRender: boolean;
    static inputValueMapping: Mapping<(value: unknown) => unknown>;
    static specificationToPropertyMapping: Mapping<{
        invert?: boolean;
        name: string;
    }>;
    static knownPropertyOrdering: string[];
    static scrollAndFocusTimeoutInMilliseconds: number;
    static maximumNumberOfInputChangesPerUpdate: number;
    static _name: string;
    scope: EvaluationScope;
    actionResults: Mapping<unknown>;
    clearButtons: Array<AnnotatedDomNode>;
    resetButtons: Array<AnnotatedDomNode>;
    spinner: Array<AnnotatedDomNode>;
    statusMessageBoxes: Array<AnnotatedDomNode>;
    submitButtons: Array<AnnotatedDomNode>;
    truncateButtons: Array<AnnotatedDomNode>;
    dependencyMapping: Mapping<Array<string>>;
    evaluations: Array<Evaluation>;
    groups: Array<[AnnotatedDomNode, GroupSpecification]>;
    determinedTargetURL: null | string;
    initialData: Mapping<unknown>;
    initialResponse: FormResponse | null;
    latestResponse: FormResponse | null;
    message: string;
    response: FormResponse | null;
    inputEventBindings: Mapping<() => void>;
    inputConfigurations: Mapping<InputConfiguration>;
    inputNames: Array<string>;
    invalid: boolean | null;
    invalidConstraint: Constraint | null;
    onceSubmitted: boolean;
    pending: boolean;
    submitted: boolean;
    valid: boolean | null;
    reCaptchaFallbackInput: AnnotatedDomNode | null;
    reCaptchaFallbackRendered: boolean;
    reCaptchaPromiseResolver: (result: null | string) => void;
    reCaptchaPromise: Promise<string | null>;
    reCaptchaToken: null | string;
    additionalConfiguration: RecursivePartial<Configuration> | undefined;
    baseConfiguration: RecursivePartial<Configuration> | undefined;
    configuration: RecursivePartial<Configuration> | undefined;
    dynamicConfiguration: RecursivePartial<Configuration> | undefined;
    resolvedConfiguration: Configuration;
    urlConfiguration: null | RecursivePartial<Configuration>;
    queryParameters: QueryParameters;
    readonly self: typeof AgileForm;
    readonly lock: Lock<string | undefined>;
    _evaluationResults: Array<unknown>;
    /**
     * Defines dynamic getter and setter interface and resolves a configuration
     * object.
     */
    constructor();
    /**
     * Parses a given configuration object and delegates to forward them to
     * nested input nodes.
     * @param name - Attribute name which was updates.
     * @param newValue - New updated value.
     */
    onUpdateAttribute(name: string, newValue: string): Promise<void>;
    /**
     * Registers new re-captcha token.
     */
    connectedCallback(): void;
    /**
     * De-registers all necessary event listener.
     */
    disconnectedCallback(): void;
    /**
     * Triggered when content projected and nested dom nodes are ready to be
     * traversed. Selects all necessary dom nodes.
     * @param reason - Description why rendering is necessary.
     * @param resolveRendering - Indicates whether rendering should be resolved
     * finally. Should be set to "false" via super calls in inherited render
     * methods which do further dom manipulations afterward and resolve the
     * rendering process by their own.
     * @returns A promise resolving when rendering has finished. A promise may
     * be needed for classes inheriting from this class.
     */
    render(reason?: string, resolveRendering?: boolean): Promise<void>;
    /**
     * Performs a single render cycle. Listeners can prevent it by calling
     * "preventDefault()" on the dispatched "render" event.
     * @param reason - Description why rendering is necessary.
     * @param resolveRendering - Indicates whether rendering should be resolved
     * finally.
     * @returns A promise resolving when rendering has finished.
     */
    processRendering(reason: string, resolveRendering: boolean): Promise<void>;
    /**
     * Fades out given dom node.
     * @param domNode - Node to fade.
     * @param durationInMilliseconds - Duration of animation.
     */
    fadeOut(domNode: AnnotatedDomNode, durationInMilliseconds?: number): Promise<void>;
    /**
     * Fades out given dom node.
     * @param domNode - Node to fade.
     * @param durationInMilliseconds - Duration of animation.
     */
    fadeIn(domNode: AnnotatedDomNode, durationInMilliseconds?: number): Promise<void>;
    /**
     * Adds given dom nodes visual representation.
     * @param domNode - Node to show.
     */
    show(domNode: AnnotatedDomNode): Promise<void>;
    /**
     * Removes given dom nodes visual representation.
     * @param domNode - Node to hide.
     */
    hide(domNode: AnnotatedDomNode): Promise<void>;
    /**
     * Shows the spinner.
     */
    showSpinner(): void;
    /**
     * Hides the spinner.
     */
    hideSpinner(): void;
    /**
     * Updates given field (by name) visibility state.
     * @param name - Field name to update.
     * @returns A promise resolving to a boolean value indicating whether a
     * visibility change happened.
     */
    updateInputVisibility(name: string): Promise<boolean>;
    /**
     * Updates all group visibility states.
     */
    updateAllGroups(): void;
    /**
     * Evaluate dynamic text content.
     * @param domNode - Dom node to render its content.
     */
    updateGroupContent(domNode: AnnotatedDomNode): void;
    /**
     * Updates current error message box state.
     * @param message - New message string to show.
     */
    updateMessageBox(message?: null | string): void;
    /**
     * Normalizes given url configuration to support deprecated formats.
     * 1. Alias top level configuration key "model" to "inputs".
     * 2. Respect top level property configuration (not having a nested
     *    "properties" key in the input configuration).
     * 3. Alias top level input property configuration "mutable" and "writable"
     *    into properties top level inverted "disabled" configuration.
     * 4. Alias top level input property configuration "nullable" into
     *    properties top level inverted "required" configuration.
     * @param configuration - Configuration object to normalize.
     * @returns Normalized configuration.
     */
    static normalizeURLConfiguration(configuration: PlainObject): RecursivePartial<Configuration>;
    /**
     * Normalizes given evaluations.
     * @param evaluations - Given evaluations to normalize.
     * @returns Normalized evaluations.
     */
    static normalizeEvaluations(evaluations?: GivenEvaluations | null): Array<Evaluation>;
    /**
     * Normalizes given configuration.
     * @param configuration - Configuration object to normalize.
     * @returns Normalized configuration.
     */
    static normalizeConfiguration(configuration: RecursivePartial<Configuration>): NormalizedConfiguration;
    /**
     * Merge a given configuration into a resolved configuration object.
     * @param configuration - Configuration to merge.
     */
    mergeConfiguration(configuration: RecursivePartial<Configuration>): void;
    /**
     * Resolve and merges configuration sources into a final object.
     */
    resolveConfiguration(): void;
    /**
     * Determines configuration by existing url parameter.
     * @returns Nothing.
     */
    getConfigurationFromURL(): null | RecursivePartial<Configuration>;
    /**
     * Determines action triggering dom nodes to add event listener to.
     */
    registerActionListener(): void;
    /**
     * Forwards all input specifications to their corresponding input node.
     * Observes fields for changes to apply specified inter-constraints between
     * them.
     */
    configureContentProjectedElements(): Promise<void>;
    /**
     * Determine all environment variables to run expressions again. We have to
     * do this a second time to include dynamically added inputs in prototyping
     * mode.
     */
    determineInputNames(): void;
    /**
     * Finds all fields and connects them with their corresponding model
     * specification.
     * @returns An object mapping with missing but specified fields.
     */
    connectSpecificationWithDomNodes(): Promise<Mapping<InputConfiguration>>;
    /**
     * Whenever a component is re-configured, a digest is needed to ensure that
     * its internal state has been reflected.
     * @param numberOfCycles - Number of digest cycles to wait until resolve
     * resulting promise.
     * @returns A promise resolving when digest hast been finished.
     */
    digest(numberOfCycles?: number): Promise<void>;
    /**
     * Finds all groups and connects them with their corresponding compiled
     * show if indicator functions. Additionally, some description will be
     * supplied.
     */
    setGroupSpecificConfigurations(): void;
    /**
     * Generates a mapping from each field name to their corresponding
     * dependent field names.
     */
    createDependencyMapping(): void;
    /**
     * Pre-compiles a specified given expression for a given field.
     * @param name - Field name to pre-compile their expression.
     * @param type - Indicates which expression type should be compiled.
     */
    preCompileExpressions(name: string, type?: string): void;
    /**
     * Pre-compiles specified given dynamic extend expressions for a given
     * field.
     * @param name - Field name to pre-compile their expression.
     */
    preCompileDynamicExtendStructure(name: string): void;
    /**
     * Pre-compiles all specified action expressions.
     */
    preCompileActions(): void;
    /**
     * Pre-compiles all specified target action expressions.
     */
    preCompileTargetActions(): void;
    /**
     * Pre-compiles all specified generic evaluations.
     */
    preCompileGenericEvaluations(): void;
    /**
     * Pre-compiles all specified expressions given by the current
     * configuration.
     */
    preCompileConfigurationExpressions(): void;
    /**
     * Determines a simple scope for partial configuration evaluations.
     * @returns Scope.
     */
    determineConfigurationEvaluationScope(): Mapping<unknown>;
    determineTemplateEvaluationScope(): Mapping<unknown>;
    /**
     * Can be triggered vie provided action condition. Can for example retrieve
     * initial user-specific state depending on remote response.
     * @returns Promise resolving to nothing when initial request has been
     * done.
     */
    initialize(): Promise<void>;
    /**
     * Resolve target action.
     * @param action - Action to resolve.
     * @param name - Action description.
     * @returns A target action url result or undefined.
     */
    resolveTargetAction(action: TargetAction, name: string): null | string;
    /**
     * Sets all given input fields to their corresponding default values.
     * @param event - Triggered event object.
     */
    onClear: (event: MouseEvent) => void;
    /**
     * Callback triggered when any keyboard events occur.
     * Enter key down events in input fields trigger a form submitted.
     * @param event - Keyboard event object.
     */
    onKeyDown: (event: KeyboardEvent) => void;
    /**
     * Sets all given input fields to their corresponding initial values.
     * @param event - Triggered event object.
     */
    onReset: (event: MouseEvent) => void;
    /**
     * Triggers form submit.
     * @param event - Triggered event object.
     */
    onSubmit: (event: KeyboardEvent | MouseEvent) => void;
    /**
     * Clears all given input fields.
     * @param event - Triggered event object.
     */
    onTruncate: (event: MouseEvent) => void;
    /**
     * Sets all given input fields to their initial value.
     * @param event - Triggered event object.
     * @param useDefault - Indicates to use default value while resetting.
     * @returns A promise resolving to nothing.
     */
    doReset: (event: MouseEvent, useDefault?: boolean | null) => Promise<void>;
    /**
     * Sets given input field their initial value.
     * @param name - Name of the field to clear.
     * @param useDefault - Indicates to use default value while resetting.
     * @returns A promise resolving to a boolean indicating whether provided
     * field name exists.
     */
    resetInput(name: string, useDefault?: boolean | null): Promise<boolean>;
    /**
     * Calculates current document relative offset of given dom node's
     * position.
     * @param domNode - Target node to calculate from.
     * @returns Calculated values.
     */
    getOffset(domNode: AnnotatedDomNode): Offset;
    /**
     * Scrolls to the given element and focuses it. Focusing happens once the
     * target position is reached, scrolling ends (for example, when it was
     * interrupted) or a timeout expires, whichever comes first.
     * @param targetDomNode - Dom node to scroll to.
     * @param smooth - Indicates whether to animate scrolling.
     * @returns A promise resolving when focusing has finished.
     */
    scrollAndFocus(targetDomNode: AnnotatedDomNode, smooth?: boolean): Promise<void>;
    /**
     * Sets all hidden non-persistent input fields to their initial value.
     * @returns A promise resolving to nothing.
     */
    resetAllHiddenNonPersistentInputs(): Promise<void>;
    /**
     * Retrieves current raw data from given input fields and retrieves invalid
     * fields.
     * @returns An object containing raw data and a list of invalid input
     * fields.
     */
    getData: () => ResponseResult;
    /**
     * Sets a global validation message and scrolls to the first invalid field.
     * @param _data - Data given by the form.
     * @param invalidInputNames - All currently invalid fields names.
     */
    handleInvalidSubmittedInput(_data: Mapping<unknown>, invalidInputNames: Array<string>): void;
    /**
     * Handle valid sent data and redirects to the corresponding specified
     * target page.
     * @param data - Data given by the form.
     * @param newWindow - Indicates whether action targets should be opened in
     * a new window.
     * @returns Redirection target.
     */
    handleValidSentData(data: Mapping<unknown>, newWindow?: boolean): string;
    /**
     * Handles invalid sent data by setting a message and tracking resulting
     * events.
     * @param response - Servers response.
     * @param rawData - Data given by the form.
     */
    handleUnsuccessfulSentRequest(response: FormResponse, rawData: null | PlainObject): void;
    /**
     * Sends a request to provided target configuration and triggers different
     * response-dependent events.
     * @param target - Configuration how to request.
     * @param rawData - Initial data to send, needed for tracking additional
     * information for triggered request.
     * @returns A promise wrapping the response.
     */
    doRequest(target: TargetConfiguration, rawData?: null | PlainObject): Promise<null | FormResponse>;
    /**
     * Send given data to server und interpret response.
     * @param event - Triggering event object.
     * @param data - Valid data given by the form.
     * @param newWindow - Indicates whether action targets should be opened in
     * a new window.
     * @returns Promise holding nothing.
     */
    handleValidSubmittedInput(event: Event, data: Mapping<unknown>, newWindow?: boolean): Promise<void>;
    /**
     * Maps given field names to endpoint's expected ones.
     * @param data - To transform.
     * @returns Resulting transformed data.
     */
    mapTargetNames(data: Mapping<unknown>): Mapping<unknown>;
    /**
     * Check the validation state of all content-projected inputs, represents
     * overall validation state, and sends data to the configured target.
     * @param event - Triggered event object.
     */
    doSubmit: (event: KeyboardEvent | MouseEvent) => Promise<void>;
    /**
     * Add all necessary field event listeners to trigger necessary checks and
     * start a dependent field change cascade.
     */
    applyInputBindings(): void;
    /**
     * Updates all fields.
     * @param event - Triggering event object.
     * @returns Promise holding nothing.
     */
    updateAllInputs(event: Event): Promise<void>;
    /**
     * Updates the given input (by name) dynamic expression and its visibility
     * state.
     * @param name - Field name to update.
     * @param event - Triggering event object.
     * @param cascade - State of the update cascade this update belongs to.
     * @returns A Promise resolving to a boolean indicator whether a state
     * changed happened or not.
     */
    updateInput(name: string, event: Event, cascade?: InputUpdateCascade): Promise<boolean>;
    /**
     * Updates all related fields for the given field name.
     * @param name - Field to check their dependent fields.
     * @param event - Triggering event.
     * @param cascade - State of the update cascade this update belongs to.
     * @returns Promise holding nothing.
     */
    updateInputDependencies(name: string, event: Event, cascade?: InputUpdateCascade): Promise<void>;
    /**
     * Trigger inputs internal change detection.
     * @param name - Field name to update their model.
     * @returns A promise resolving to nothing.
     */
    triggerModelUpdate(name: string): Promise<void>;
    /**
     * Derives event name from a given event.
     * @param event - Event to derive name from.
     * @returns Derived name.
     */
    determineEventName(event: Event & {
        detail?: {
            parameter?: Array<{
                type?: string;
            }>;
            type?: string;
        };
    }): string;
    /**
     * Evaluate all generic expression results.
     */
    runEvaluations(): void;
    /**
     * Indicates a background-running process. Sets "pending" property and
     * triggers a loading spinner.
     * @param event - Triggering event object.
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    startBackgroundProcess(event: Event): Promise<void>;
    /**
     * Stops indicating a background-running process. Sets "pending" property
     * and stop showing a loading spinner.
     * @param event - Triggering event object.
     * @returns A Promise resolving when all items render updates has been
     * done.
     */
    stopBackgroundProcess(event: Event): Promise<void>;
    /**
     * Determines whether the current value state can be derived by a given
     * configuration or has to be saved.
     * @param name - Model name to derive from.
     * @returns A boolean indicating the neediness.
     */
    isDeterminedStateValueNeeded(name: string): boolean;
    /**
     * Determines current state url.
     * @returns URL.
     */
    determineStateURL: () => StateURL;
    /**
     * Tracks given data if the tracking environment exists.
     * @param name - Event name to trigger.
     * @param data - Data to track.
     * @returns "false" if event is cancelable, and at least one of the event
     * handlers which received event called "Event.eventDefault()" and "true"
     * otherwise.
     */
    triggerEvent(name: string, data: Mapping<unknown>): boolean;
    /**
     * Renders user interaction re-captcha version if the corresponding
     * placeholder is available.
     * @returns A boolean indicating if a fallback node was found to render.
     */
    updateReCaptchaFallbackToken(): boolean;
    /**
     * Updates internal saved re-captcha token.
     * @returns Promise resolving to challenge token or null if initialization
     * was unsuccessful.
     */
    updateReCaptchaToken(): Promise<null | string>;
}
export declare const api: WebComponentAPI<typeof AgileForm>;
export default AgileForm;
