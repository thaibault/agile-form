// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
'use strict'
/* !
    region header
    Copyright Torben Sickert (info["~at~"]tsickert.com) 16.12.2012

    License
    -------

    This library written by Torben Sickert stands under a creative commons
    naming 4.0 international license.
    See https://creativecommons.org/licenses/by/4.0/deed.de
    endregion
*/
// region imports
import type {Mapping} from 'clientnode'

import type {
    Action,
    AnnotatedDomNode,
    AnnotatedInputDomNode,
    Configuration,
    Evaluation,
    FormResponse,
    GroupSpecification,
    InputConfiguration,
    TargetAction,
    TargetConfiguration
} from './type'

import {copy, globalContext, timeout} from 'clientnode'
import nodeFetch, {Headers as NodeFetchHeaders} from 'node-fetch'
import TextInput from 'web-input-material/components/TextInput'

import {
    afterEach, beforeEach, describe, expect, jest, test
} from '@jest/globals'
import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter'

import AgileForm, {api, log} from './index'
// endregion
/*
    NOTE: We have to preload this module to avoid introducing an additional
    asynchronous chunk.
*/
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('node-fetch/src/utils/multipart-parser')
globalContext.fetch = nodeFetch as unknown as typeof fetch
if (!(globalContext.Headers as unknown))
    globalContext.Headers = NodeFetchHeaders as unknown as typeof Headers

// Registers "text-input" tag.
TextInput.register()

const name = 'test-form'
api.register(name)

describe('api', () => {
    test('api definitions', () => {
        expect(api).toBeDefined()
        expect(api).toHaveProperty('component', AgileForm)

        expect(document.createElement(name)).toBeInstanceOf(AgileForm)
    })
})
describe('AgileForm', (): void => {
    test('custom element definition', () => {
        const form = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        expect(form).toBeDefined()
    })
    test('attribute configuration', async () => {
        const form = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        form.setAttribute('configuration', '{value: 2}')
        await timeout()

        expect(form).toHaveProperty('configuration.value', 2)
        expect(form).toHaveProperty('resolvedConfiguration.value', 2)
    })
    test('input connections', async (): Promise<void> => {
        const form = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        expect(form).toHaveProperty('inputConfigurations', {})

        const input: HTMLElement = document.createElement('text-input')
        const inputName = 'test'
        input.setAttribute('name', inputName)
        form.appendChild(input)
        await form.render()

        expect(form.inputConfigurations).toHaveProperty('test.domNode', input)
        expect(form.inputConfigurations)
            .toHaveProperty('test.domNodes', [input])
        expect(form.inputConfigurations)
            .toHaveProperty('test.dependsOn', ['test'])
        expect(form.inputConfigurations).toHaveProperty('test.name', 'test')
        expect(form.inputConfigurations).toHaveProperty('test.properties', {})
        expect(form.inputConfigurations).toHaveProperty('test.shown', true)

        form.resolvedConfiguration.inputs[inputName] = {}
        await form.render()
        expect(form.inputConfigurations)
            .toHaveProperty([inputName, 'domNode'], input)
    })
    // region configuration
    test('normalizeURLConfiguration', (): void => {
        const form = document.createElement(name) as AgileForm

        expect(form.self.normalizeURLConfiguration({})).toStrictEqual({})

        expect(form.self.normalizeURLConfiguration({a: 2}))
            .toStrictEqual({a: 2})

        expect(form.self.normalizeURLConfiguration({a: 2, model: {b: {}}}))
            .toStrictEqual({a: 2, inputs: {b: {properties: {}}}})

        expect(form.self.normalizeURLConfiguration({
            a: 2, model: {b: {
                mutable: false,
                writable: false,
                selection: [],
                value: 3,
                nullable: false
            }}
        }))
            .toStrictEqual({
                a: 2, inputs: {b: {properties: {
                    disabled: true,
                    required: true,
                    selection: [],
                    value: 3
                }}}
            })
    })
    test('normalizeConfiguration', (): void => {
        const form = document.createElement(name) as AgileForm

        expect(form.self.normalizeConfiguration({})).toStrictEqual({
            evaluations: [], tag: {values: []}
        })

        expect(form.self.normalizeConfiguration({
            evaluations: ['a', '5'], tags: 'tag-a'
        } as unknown as Configuration)).toStrictEqual({
            evaluations: [['a', '5']], tag: {values: ['tag-a']}
        })

        expect(form.self.normalizeConfiguration({
            evaluations: [['a', '5'], ['b', '4']],
            tag: {values: 'tag-a'},
            tags: ['tag-b']
        } as unknown as Configuration)).toStrictEqual({
            evaluations: [['a', '5'], ['b', '4']],
            tag: {values: ['tag-a', 'tag-b']}
        })

        expect(form.self.normalizeConfiguration({
            evaluations: [['a', '4']],
            tag: {values: ['tag-a', 'tag-c']},
            tags: ['tag-b']
        } as unknown as Configuration)).toStrictEqual({
            evaluations: [['a', '4']],
            tag: {values: ['tag-a', 'tag-c', 'tag-b']}
        })
    })
    test('normalizeEvaluations', (): void => {
        const form = document.createElement(name) as AgileForm

        expect(form.self.normalizeEvaluations([])).toStrictEqual([])
        expect(form.self.normalizeEvaluations([{}])).toStrictEqual([])
        expect(form.self.normalizeEvaluations({})).toStrictEqual([])
        expect(form.self.normalizeEvaluations(
            {base: {evaluations: [], order: 0}}
        )).toStrictEqual([])

        expect(form.self.normalizeEvaluations([['a', 1]]))
            .toStrictEqual([['a', 1]])
        expect(form.self.normalizeEvaluations({
            a: {
                order: -1,
                evaluations: {a: 1}
            },
            b: {
                order: 0,
                evaluations: ['b', '1 + 1']
            },
            c: {
                order: 100,
                evaluations: ['c', '2 + 1']
            }
        }))
            .toStrictEqual([['a', 1], ['b', '1 + 1'], ['c', '2 + 1']])
    })
    test('mergeConfiguration', (): void => {
        const form = document.createElement(name) as AgileForm

        const initialConfiguration: Configuration =
            copy(form.resolvedConfiguration)

        form.mergeConfiguration({})
        expect(form.resolvedConfiguration).toStrictEqual(initialConfiguration)

        form.mergeConfiguration({a: 2} as unknown as Configuration)
        expect(form.resolvedConfiguration)
            .toStrictEqual({...initialConfiguration, a: 2})

        form.mergeConfiguration(
            {evaluations: ['a', '2']} as unknown as Configuration
        )
        expect(form.resolvedConfiguration.evaluations).toStrictEqual(
            [
                ...initialConfiguration.evaluations as Array<Evaluation>,
                ['a', '2']
            ]
        )
    })
    test('resolveConfiguration', (): void => {
        const form = document.createElement(name) as AgileForm

        const initialConfiguration: Configuration =
            copy(form.resolvedConfiguration)

        form.resolveConfiguration()
        expect(form.resolvedConfiguration).toStrictEqual(initialConfiguration)

        form.additionalConfiguration = {a: 2} as unknown as Configuration
        form.resolveConfiguration()
        expect(form.resolvedConfiguration)
            .toStrictEqual({...initialConfiguration, a: 2})
    })
    test('getConfigurationFromURL', (): void => {
        const form = document.createElement(name) as AgileForm

        expect(form.getConfigurationFromURL()).toStrictEqual(null)

        form.queryParameters[form.resolvedConfiguration.name] = '{}'
        const configuration = form.getConfigurationFromURL()
        if (configuration)
            expect(Object.keys(configuration))
                .toHaveProperty('length', 0)

        form.queryParameters[form.resolvedConfiguration.name] = '{a: 2}'
        expect(form.getConfigurationFromURL()).toStrictEqual({})

        form.resolvedConfiguration.urlConfigurationMask =
            {exclude: false, include: true}
        form.queryParameters[form.resolvedConfiguration.name] = '{a: 2}'
        expect(form.getConfigurationFromURL()).toStrictEqual({a: 2})

        form.resolvedConfiguration.urlConfigurationMask =
            {exclude: true, include: true}
        form.queryParameters[form.resolvedConfiguration.name] = '{a: 2}'
        expect(form.getConfigurationFromURL()).toStrictEqual({})

        form.resolvedConfiguration.urlConfigurationMask =
            {exclude: {a: true}, include: true}
        form.queryParameters[form.resolvedConfiguration.name] = '{a: 2}'
        expect(form.getConfigurationFromURL()).toStrictEqual({})

        form.resolvedConfiguration.urlConfigurationMask =
            {exclude: false, include: false}
        form.queryParameters[form.resolvedConfiguration.name] = '{a: 2}'
        expect(form.getConfigurationFromURL()).toStrictEqual({})

        form.resolvedConfiguration.urlConfigurationMask =
            {exclude: false, include: {a: true}}
        form.queryParameters[form.resolvedConfiguration.name] = '{a: 2}'
        expect(form.getConfigurationFromURL()).toStrictEqual({a: 2})
    })
    // endregion
})
// region helper
const originalFetch = globalContext.fetch

/**
 * Creates a not yet connected form instance with disabled animations.
 * @returns Created form instance.
 */
const createForm = (): AgileForm => {
    const form = document.createElement(name) as AgileForm
    form.resolvedConfiguration.animation = false

    return form
}
/**
 * Creates a minimal input configuration.
 * @param inputName - Name of the input.
 * @param configuration - Additional configurations to merge.
 * @returns Created input configuration.
 */
const createInputConfiguration = (
    inputName: string, configuration: Partial<InputConfiguration> = {}
): InputConfiguration => ({
    domNodes: [], name: inputName, properties: {}, ...configuration
})
/**
 * Creates a dom node to be used as input.
 * @param tagName - Tag name of the node to create.
 * @returns Created dom node.
 */
const createDomNode = (tagName = 'div'): AnnotatedInputDomNode =>
    document.createElement(tagName) as unknown as AnnotatedInputDomNode
/**
 * Records all given events triggered on the given form.
 * @param form - Form to listen on.
 * @param names - Event names to record.
 * @returns List of recorded event name and detail tuples.
 */
const recordEvents = (
    form: AgileForm, names: Array<string>
): Array<[string, Mapping<unknown>]> => {
    const events: Array<[string, Mapping<unknown>]> = []
    for (const eventName of names)
        form.addEventListener(eventName, (event: Event) => {
            events.push(
                [eventName, (event as CustomEvent<Mapping<unknown>>).detail]
            )
        })

    return events
}
/**
 * Creates a fetch response like object.
 * @param body - Response text.
 * @param status - Http status code.
 * @param ok - Indicates a successful response.
 * @returns Created response.
 */
const createResponse = (
    body: string, status = 200, ok = status >= 200 && status < 300
): Response => ({
    ok,
    status,
    text: () => Promise.resolve(body)
}) as unknown as Response
/**
 * Replaces global fetch implementation with a mock.
 * @param implementation - Mocked fetch implementation.
 * @returns Created mock.
 */
const mockFetch = (
    implementation: () => Promise<Response>
): jest.Mock<() => Promise<Response>> => {
    const mock = jest.fn(implementation)
    globalContext.fetch = mock

    return mock
}
const getHash = (): string => location.hash

let logDebug: jest.SpiedFunction<typeof log.debug>
let logError: jest.SpiedFunction<typeof log.error>
let logWarn: jest.SpiedFunction<typeof log.warn>
let scrollTo: jest.SpiedFunction<typeof window.scrollTo>

beforeEach(() => {
    logDebug = jest.spyOn(log, 'debug')
        .mockImplementation(() => Promise.resolve())
    logError = jest.spyOn(log, 'error')
        .mockImplementation(() => Promise.resolve())
    jest.spyOn(log, 'info').mockImplementation(() => Promise.resolve())
    logWarn = jest.spyOn(log, 'warn')
        .mockImplementation(() => Promise.resolve())

    scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {
        // Not supported by jsdom.
    })
})
afterEach(() => {
    jest.restoreAllMocks()

    globalContext.fetch = originalFetch
    history.replaceState(null, '', '/')
})
// endregion
describe('AgileForm helper', (): void => {
    test('resolveTargetAction', (): void => {
        const form = createForm()

        const action = (
            target: unknown, result?: unknown
        ): TargetAction => ({
            code: '',
            indicator: result === undefined ? undefined : () => result,
            name: 'test',
            target: target as string
        })

        expect(form.resolveTargetAction(action('/a'), 'test')).toBeNull()
        expect(form.resolveTargetAction(action('/a', false), 'test'))
            .toBeNull()
        expect(form.resolveTargetAction(action(' /a ', true), 'test'))
            .toStrictEqual('/a')
        expect(form.resolveTargetAction(action(undefined, true), 'test'))
            .toStrictEqual('')
        expect(form.resolveTargetAction(
            action('/a', 'https://example.com/b'), 'test'
        )).toStrictEqual('https://example.com/b')
        expect(form.resolveTargetAction(action('/a', '//host/b'), 'test'))
            .toStrictEqual('//host/b')
        expect(form.resolveTargetAction(action('', 'b=2'), 'test'))
            .toStrictEqual('b=2')
        expect(form.resolveTargetAction(action('/a?', 'b=2'), 'test'))
            .toStrictEqual('/a?b=2')
        expect(form.resolveTargetAction(action('/a?c=1&', 'b=2'), 'test'))
            .toStrictEqual('/a?c=1&b=2')
        expect(form.resolveTargetAction(action('/a', 'b=2'), 'test'))
            .toStrictEqual('/a?b=2')
        expect(form.resolveTargetAction(action('/a?c=1', 'b=2'), 'test'))
            .toStrictEqual('/a?c=1&b=2')
    })
    test('determineEventName', (): void => {
        const form = createForm()

        const event = (detail?: unknown): Event =>
            new CustomEvent('original', {detail})

        expect(form.determineEventName(new Event('click')))
            .toStrictEqual('click')
        expect(form.determineEventName(event())).toStrictEqual('original')
        expect(form.determineEventName(event({type: 'detail'})))
            .toStrictEqual('detail')
        expect(form.determineEventName(event({parameter: []})))
            .toStrictEqual('original')
        expect(form.determineEventName(event({parameter: [{type: 'first'}]})))
            .toStrictEqual('first')
        expect(form.determineEventName(event({
            parameter: [{type: 'first'}, {type: 'second'}]
        }))).toStrictEqual('second')
        expect(form.determineEventName(event({
            parameter: [{type: 'first'}, {}]
        }))).toStrictEqual('first')
        expect(form.determineEventName(event({
            parameter: [{}, {}], type: 'detail'
        }))).toStrictEqual('detail')
        expect(form.determineEventName(
            {type: undefined} as unknown as Event
        )).toStrictEqual('unknown')
    })
    test('mapTargetNames', (): void => {
        const form = createForm()
        form.inputConfigurations = {
            a: createInputConfiguration('a'),
            b: createInputConfiguration('b', {target: 'B'}),
            c: createInputConfiguration('c', {target: ''})
        }

        expect(form.mapTargetNames({})).toStrictEqual({})
        expect(form.mapTargetNames({a: 1, b: 2, c: 3, d: 4}))
            .toStrictEqual({a: 1, B: 2, d: 4})
    })
    test('createDependencyMapping', (): void => {
        const form = createForm()
        form.inputConfigurations = {
            a: createInputConfiguration('a', {dependsOn: ['b', 'c']}),
            b: createInputConfiguration(
                'b', {dependsOn: 'c' as unknown as Array<string>}
            ),
            c: createInputConfiguration('c'),
            d: createInputConfiguration('d', {dependsOn: ['b', 'b']})
        }

        form.createDependencyMapping()

        expect(form.dependencyMapping).toStrictEqual({
            a: [], b: ['a', 'd'], c: ['a', 'b'], d: []
        })
    })
    test('handleUnsuccessfulSentRequest', (): void => {
        const form = createForm()
        const events = recordEvents(form, [
            'reCaptchaCheckFailed',
            'reCaptchaFallbackCheckFailed',
            'serverAuthenticationInvalid',
            'serverEMailAddressInvalid',
            'serverFormOutdated',
            'serverUnexpected'
        ])

        const response = (status: number, data: unknown = {a: 1}) =>
            ({data, status}) as unknown as FormResponse

        form.handleUnsuccessfulSentRequest(response(406), {b: 2})
        form.handleUnsuccessfulSentRequest(response(401), null)
        form.handleUnsuccessfulSentRequest(response(403), null)
        form.handleUnsuccessfulSentRequest(response(420), null)
        form.reCaptchaFallbackRendered = true
        form.handleUnsuccessfulSentRequest(response(420), null)
        form.handleUnsuccessfulSentRequest(response(428), null)
        form.handleUnsuccessfulSentRequest(response(500, null), null)

        expect(events.map(([eventName]) => eventName)).toStrictEqual([
            'serverEMailAddressInvalid',
            'serverAuthenticationInvalid',
            'serverAuthenticationInvalid',
            'reCaptchaCheckFailed',
            'reCaptchaFallbackCheckFailed',
            'serverFormOutdated',
            'serverUnexpected'
        ])
        expect(events[0][1])
            .toStrictEqual({reference: {request: {b: 2}, response: {a: 1}}})
        expect(events[6][1])
            .toStrictEqual({reference: {request: null, response: null}})
    })
    test('handleValidSentData', (): void => {
        const form = createForm()
        const events = recordEvents(form, ['submitSuccessful'])
        const open = jest.spyOn(window, 'open')
            .mockImplementation(() => null)

        expect(form.handleValidSentData({a: 1})).toStrictEqual('')
        expect(events).toHaveLength(1)
        expect(events[0][1]).toHaveProperty('reference.request', {a: 1})

        let result: unknown = false
        form.resolvedConfiguration.targetActions = {
            initialize: {
                code: '', indicator: () => true, name: 'initialize', target: ''
            },
            fallback: {code: 'fallback', name: 'fallback', target: ' #b '},
            a: {
                code: '',
                indicator: () => result,
                name: 'a',
                target: '#a'
            }
        }

        expect(form.handleValidSentData({})).toStrictEqual('#b')
        expect(getHash()).toStrictEqual('#b')

        result = true
        expect(form.handleValidSentData({})).toStrictEqual('#a')
        expect(getHash()).toStrictEqual('#a')

        expect(form.handleValidSentData({}, true)).toStrictEqual('#a')
        expect(open).toHaveBeenCalledWith('#a')
    })
    test('handleInvalidSubmittedInput', async (): Promise<void> => {
        const form = createForm()
        const input = createDomNode('input')
        input.setAttribute('name', 'b')
        form.appendChild(input)
        const focus = jest.spyOn(input, 'focus')

        form.handleInvalidSubmittedInput({}, ['a'])
        expect(form.message)
            .toStrictEqual('The following inputs are invalid "a".')
        expect(focus).not.toHaveBeenCalled()

        form.handleInvalidSubmittedInput({}, ['a', 'b'])
        await timeout()
        expect(form.message)
            .toStrictEqual('The following inputs are invalid "a", "b".')
        expect(focus).toHaveBeenCalled()
    })
    test('runEvaluations', (): void => {
        const form = createForm()

        form.runEvaluations()
        expect(form._evaluationResults).toStrictEqual([])

        form.evaluations = [['a', () => 2], ['b', 3]]
        form.runEvaluations()
        expect(form._evaluationResults).toStrictEqual([2, 3])
    })
    test('updateMessageBox', (): void => {
        const form = createForm()
        const box = createDomNode()
        form.statusMessageBoxes = [box]

        form.updateMessageBox()
        expect(box.style.display).toStrictEqual('none')

        form.updateMessageBox('message')
        expect(form.message).toStrictEqual('message')
        expect(box.style.display).toStrictEqual('block')
        expect(box.textContent).toStrictEqual('message')

        form.updateMessageBox()
        expect(form.message).toStrictEqual('message')

        form.updateMessageBox(null)
        expect(form.message).toStrictEqual('')
        expect(box.style.display).toStrictEqual('none')
    })
    test('triggerEvent', (): void => {
        const form = createForm()
        const events = recordEvents(form, ['test'])

        const reference = {a: {b: 1}}
        expect(form.triggerEvent('test', {reference})).toStrictEqual(true)
        expect(form.triggerEvent('test', {plain: 2})).toStrictEqual(true)

        expect(events[0][1].reference).toStrictEqual(reference)
        expect(events[0][1].reference).not.toBe(reference)
        expect(events[1][1]).toStrictEqual({plain: 2})
    })
    test('getOffset', (): void => {
        const form = createForm()
        const domNode = createDomNode()

        expect(form.getOffset(domNode)).toStrictEqual({left: 0, top: 0})

        jest.spyOn(domNode, 'getBoundingClientRect').mockReturnValue(
            {left: 10, top: 20} as DOMRect
        )
        expect(form.getOffset(domNode)).toStrictEqual({left: 10, top: 20})
    })
    describe('scrollAndFocus', (): void => {
        /**
         * Overwrites a window or document property for the current test.
         * @param target - Object to overwrite on.
         * @param key - Property name to overwrite.
         * @param value - Value to provide.
         * @returns Function to restore the original property.
         */
        const overwrite = (
            target: object, key: string, value: number
        ): () => void => {
            const descriptor =
                Object.getOwnPropertyDescriptor(target, key)
            Object.defineProperty(target, key, {configurable: true, value})

            return () => {
                if (descriptor)
                    Object.defineProperty(target, key, descriptor)
                else
                    delete (target as Mapping<unknown>)[key]
            }
        }
        /**
         * Places given dom node at given document position on a document
         * with given height and a viewport of 768 pixels.
         * @param domNode - Node to position.
         * @param top - Document offset of the node.
         * @param documentHeight - Total scrollable document height.
         * @returns Function to restore all overwritten properties.
         */
        const setUpLayout = (
            domNode: HTMLElement, top: number, documentHeight: number
        ): () => void => {
            jest.spyOn(domNode, 'getBoundingClientRect')
                .mockReturnValue({left: 0, top} as DOMRect)

            const restorer = [
                overwrite(window, 'innerHeight', 768),
                overwrite(window, 'scrollY', 0),
                overwrite(
                    document.documentElement, 'scrollHeight', documentHeight
                )
            ]

            return () => {
                for (const restore of restorer)
                    restore()
            }
        }

        test('target position already reached', async (): Promise<
            void
        > => {
            const form = createForm()
            const domNode = createDomNode('input')
            const focus = jest.spyOn(domNode, 'focus')

            await form.scrollAndFocus(domNode)
            expect(focus).toHaveBeenCalledTimes(1)
            expect(scrollTo).not.toHaveBeenCalled()

            await form.scrollAndFocus(domNode, false)
            expect(focus).toHaveBeenCalledTimes(2)
        })
        test('instant scrolling', async (): Promise<void> => {
            const form = createForm()
            const domNode = createDomNode('input')
            const focus = jest.spyOn(domNode, 'focus')
            const restore = setUpLayout(domNode, 500, 2000)

            try {
                await form.scrollAndFocus(domNode, false)
            } finally {
                restore()
            }

            expect(scrollTo).toHaveBeenCalledWith(0, 415)
            expect(focus).toHaveBeenCalledTimes(1)
        })
        test('smooth scrolling to clamped target', async (): Promise<
            void
        > => {
            const form = createForm()
            const domNode = createDomNode('input')
            const focus = jest.spyOn(domNode, 'focus')
            // The document can be scrolled by at most 1000 - 768 = 232.
            const restore = setUpLayout(domNode, 5000, 1000)
            scrollTo.mockImplementation(() => {
                // Simulate an intermediate and the final scroll position.
                for (const position of [100, 232]) {
                    Object.defineProperty(
                        window, 'scrollY', {configurable: true, value: position}
                    )
                    window.dispatchEvent(new Event('scroll'))
                }
            })

            try {
                await form.scrollAndFocus(domNode)
            } finally {
                restore()
            }

            expect(scrollTo.mock.calls)
                .toStrictEqual([[{behavior: 'smooth', top: 232}]])
            expect(focus).toHaveBeenCalledTimes(1)
        })
        test('interrupted smooth scrolling', async (): Promise<void> => {
            const form = createForm()
            const domNode = createDomNode('input')
            const focus = jest.spyOn(domNode, 'focus')
            const restore = setUpLayout(domNode, 500, 2000)
            // Scrolling stops before reaching its target.
            scrollTo.mockImplementation(() => {
                window.dispatchEvent(new Event('scrollend'))
            })

            try {
                await form.scrollAndFocus(domNode)
            } finally {
                restore()
            }

            expect(focus).toHaveBeenCalledTimes(1)

            // Late scroll events do not focus again.
            window.dispatchEvent(new Event('scroll'))
            window.dispatchEvent(new Event('scrollend'))
            expect(focus).toHaveBeenCalledTimes(1)
        })
        test('smooth scrolling timeout', async (): Promise<void> => {
            const form = createForm()
            const domNode = createDomNode('input')
            const focus = jest.spyOn(domNode, 'focus')
            const restore = setUpLayout(domNode, 500, 2000)
            const timeoutInMilliseconds =
                AgileForm.scrollAndFocusTimeoutInMilliseconds
            AgileForm.scrollAndFocusTimeoutInMilliseconds = 10

            try {
                // No scroll related event will ever be triggered.
                await form.scrollAndFocus(domNode)
            } finally {
                AgileForm.scrollAndFocusTimeoutInMilliseconds =
                    timeoutInMilliseconds
                restore()
            }

            expect(focus).toHaveBeenCalledTimes(1)
        })
    })
    test('determineTemplateEvaluationScope', (): void => {
        const form = createForm()
        form.inputConfigurations = {a: createInputConfiguration('a')}
        form.inputNames = ['a']
        form.evaluations = [['b', () => 2]]
        form.runEvaluations()

        const scope = form.determineTemplateEvaluationScope()

        expect(scope).toHaveProperty('a', form.inputConfigurations.a)
        expect(scope).toHaveProperty('b', 2)
        expect(scope).toHaveProperty('pending', true)
        expect(scope).toHaveProperty('getData', form.getData)
    })
    test('determineConfigurationEvaluationScope', (): void => {
        const form = createForm()
        form.inputConfigurations = {a: createInputConfiguration('a')}
        form.inputNames = ['a']
        form.evaluations = [['b', 3]]
        form.runEvaluations()

        const scope = form.determineConfigurationEvaluationScope()

        expect(scope).toHaveProperty('a', form.inputConfigurations.a)
        expect(scope).toHaveProperty('b', 3)
        expect(scope).toHaveProperty('name', 'aForm')
        expect(scope).toHaveProperty('queryParameters', form.queryParameters)
    })
})
describe('AgileForm expression compiler', (): void => {
    test('preCompileGenericEvaluations', (): void => {
        const form = createForm()
        form.resolvedConfiguration.evaluations = [
            ['a', '1 + 1'],
            ['b', 'a * 2'],
            ['c', 5],
            ['d', 'notDefined.property'],
            ['e', '(']
        ]

        form.preCompileGenericEvaluations()
        expect(form.evaluations.map(([evaluationName]) => evaluationName))
            .toStrictEqual(['a', 'b', 'c', 'd', 'e'])

        form.runEvaluations()
        expect(form._evaluationResults)
            .toStrictEqual([2, 4, 5, undefined, undefined])
        expect(logError).toHaveBeenCalled()
    })
    test('preCompileActions', async (): Promise<void> => {
        const form = createForm()
        form.resolvedConfiguration.actions = {
            a: {code: '1 + 2'},
            b: {code: 'fallback'},
            c: {code: 'Promise.resolve(event.type + action.name)'},
            d: {code: 'notDefined()'}
        } as unknown as Mapping<Action>

        form.preCompileActions()
        const actions = form.resolvedConfiguration.actions

        expect(actions.a.name).toStrictEqual('a')
        expect(actions.b.run).toBeUndefined()

        const event = new Event('click')
        await actions.a.run?.(event, actions.a)
        await actions.c.run?.(event, actions.c)
        await actions.d.run?.(event, actions.d)

        expect(form.actionResults).toStrictEqual({a: 3, c: 'clickc'})
        expect(logError).toHaveBeenCalled()
    })
    test('preCompileTargetActions', (): void => {
        const form = createForm()
        form.resolvedConfiguration.targetActions = {
            a: {code: 'valid', target: '/a'},
            b: {code: 'fallback', target: '/b'},
            c: {code: 'notDefined()', target: '/c'}
        } as unknown as Mapping<TargetAction>

        form.preCompileTargetActions()
        const actions = form.resolvedConfiguration.targetActions

        expect(actions.a.name).toStrictEqual('a')
        expect(actions.b.indicator).toBeUndefined()

        expect(actions.a.indicator?.()).toBeNull()
        form.valid = true
        expect(actions.a.indicator?.()).toStrictEqual(true)

        expect(actions.c.indicator?.()).toBeUndefined()
        expect(logError).toHaveBeenCalled()
    })
    test('preCompileExpressions', (): void => {
        const form = createForm()
        form.inputConfigurations = {
            a: createInputConfiguration('a', {
                dependsOn: [],
                serializerExpression: 'notDefined(value)',
                showIfExpression: 'self.name === "a"',
                transformerExpression: 'value * 2'
            }),
            b: createInputConfiguration('b', {
                dependsOn: ['a'], transformerExpression: 'value + a.name'
            })
        }

        for (const inputName of ['a', 'b'])
            for (const type of ['serializer', 'transformer', 'showIf'])
                form.preCompileExpressions(inputName, type)

        const {a, b} = form.inputConfigurations

        expect(a.transformer?.(3)).toStrictEqual(6)
        expect(a.showIf?.()).toStrictEqual(true)
        expect(a.serializer?.(5)).toStrictEqual(5)
        expect(logWarn).toHaveBeenCalled()

        expect(b.transformer?.('x')).toStrictEqual('xa')
        expect(b.serializer).toBeUndefined()
        expect(b.showIf).toBeUndefined()
    })
    test('preCompileDynamicExtendStructure', (): void => {
        const form = createForm()
        form.inputConfigurations = {
            a: createInputConfiguration('a'),
            b: createInputConfiguration('b', {
                dependsOn: ['a'],
                dynamicExtendExpressions: {
                    broken: 'notDefined()',
                    disabled: (_event: Event, scope: unknown): boolean =>
                        (scope as Mapping<unknown>).eventName === 'change',
                    label: 'selfName + a.name',
                    value: 'eventName'
                }
            })
        }

        form.preCompileDynamicExtendStructure('a')
        expect(form.inputConfigurations.a.dynamicExtend).toBeUndefined()

        form.preCompileDynamicExtendStructure('b')
        const dynamicExtend = form.inputConfigurations.b.dynamicExtend as
            Mapping<(event: Event) => unknown>
        const event = new Event('change')

        expect(dynamicExtend.value(event)).toStrictEqual('change')
        expect(dynamicExtend.label(event)).toStrictEqual('ba')
        expect(dynamicExtend.disabled(event)).toStrictEqual(true)
        expect(dynamicExtend.disabled(new Event('input')))
            .toStrictEqual(false)
        expect(dynamicExtend.broken(event)).toBeUndefined()
        expect(logError).toHaveBeenCalled()
    })
    test('preCompileConfigurationExpressions', (): void => {
        const form = createForm()
        form.resolvedConfiguration.evaluations = [['a', '2']]
        form.inputConfigurations = {
            b: createInputConfiguration('b', {transformerExpression: 'a'}),
            c: createInputConfiguration(
                'c', {dependsOn: 'b' as unknown as Array<string>}
            )
        }

        form.preCompileConfigurationExpressions()
        form.runEvaluations()

        expect(form.inputConfigurations.b.dependsOn).toStrictEqual([])
        expect(form.inputConfigurations.c.dependsOn).toStrictEqual(['b'])
        expect(form.inputConfigurations.b.transformer?.(1)).toStrictEqual(2)
    })
})
describe('AgileForm visibility and reset', (): void => {
    test('fadeIn and fadeOut without animation', async (): Promise<void> => {
        const form = createForm()
        const domNode = createDomNode()

        await form.fadeOut(domNode)
        expect(domNode.style.display).toStrictEqual('none')
        expect(domNode.oldDisplay).toStrictEqual('initial')

        await form.fadeOut(domNode)
        expect(domNode.oldDisplay).toBeUndefined()

        await form.fadeIn(domNode)
        expect(domNode.style.display).toStrictEqual('block')
        expect(domNode.style.opacity).toStrictEqual('1')

        domNode.oldDisplay = 'flex'
        await form.fadeIn(domNode)
        expect(domNode.style.display).toStrictEqual('flex')
    })
    test('show and hide', async (): Promise<void> => {
        const form = createForm()
        const domNode = createDomNode()

        await form.hide(domNode)
        expect(domNode.getAttribute('aria-hidden')).toStrictEqual('true')

        await form.show(domNode)
        expect(domNode.hasAttribute('aria-hidden')).toStrictEqual(false)
    })
    test('showSpinner and hideSpinner', async (): Promise<void> => {
        const form = createForm()

        form.showSpinner()
        form.hideSpinner()

        const spinner = createDomNode()
        const focus = jest.spyOn(spinner, 'focus')
        form.spinner = [spinner]

        form.showSpinner()
        await timeout()
        expect(spinner.style.display).toStrictEqual('block')
        expect(focus).toHaveBeenCalled()

        form.hideSpinner()
        await timeout()
        expect(spinner.style.display).toStrictEqual('none')
        expect(spinner.getAttribute('aria-hidden')).toStrictEqual('true')
    })
    test('updateInputVisibility', async (): Promise<void> => {
        const form = createForm()
        form.resolvedConfiguration.debug = true
        const domNode = createDomNode()
        let shown = false
        form.inputConfigurations = {a: createInputConfiguration('a', {
            domNodes: [domNode], showIf: () => shown
        })}

        expect(await form.updateInputVisibility('a')).toStrictEqual(true)
        await timeout()
        expect(form.inputConfigurations.a.shown).toStrictEqual(false)
        expect(domNode.shown).toStrictEqual(false)
        expect(domNode.style.display).toStrictEqual('none')

        expect(await form.updateInputVisibility('a')).toStrictEqual(false)

        shown = true
        expect(await form.updateInputVisibility('a')).toStrictEqual(true)
        await timeout()
        expect(domNode.style.display).toStrictEqual('initial')
        expect(logDebug).toHaveBeenCalled()

        // Hidden inputs will be shown when everything should be shown.
        form.resolvedConfiguration.showAll = true
        shown = false
        expect(await form.updateInputVisibility('a')).toStrictEqual(true)
        await timeout()
        expect(domNode.shown).toStrictEqual(false)
        expect(domNode.hasAttribute('aria-hidden')).toStrictEqual(false)

        // Inputs without indicator are always shown.
        form.inputConfigurations.b = createInputConfiguration('b')
        expect(await form.updateInputVisibility('b')).toStrictEqual(true)
        expect(form.inputConfigurations.b.shown).toStrictEqual(true)
    })
    test('updateInputVisibility resets on hide', async (): Promise<void> => {
        const form = createForm()
        const domNode = createDomNode()
        domNode.value = 'changed'
        form.initialData = {a: 'initial'}
        form.inputConfigurations = {a: createInputConfiguration('a', {
            domNodes: [domNode],
            showIf: () => false,
            valuePersistence: 'resetOnHide'
        })}

        await form.updateInputVisibility('a')

        expect(domNode.value).toStrictEqual('initial')
    })
    test('updateAllGroups', async (): Promise<void> => {
        const form = createForm()
        form.resolvedConfiguration.debug = true

        const group = createDomNode()
        group.setAttribute('name', 'group')
        const firstChild = createDomNode()
        const secondChild = createDomNode()
        group.appendChild(firstChild)
        group.appendChild(secondChild)

        const specification: GroupSpecification =
            {children: [firstChild, secondChild], showReason: null}
        form.groups = [[group, specification]]

        firstChild.shown = true
        secondChild.shown = false
        form.updateAllGroups()
        await timeout()
        expect(group.shown).toStrictEqual(true)
        expect(specification.showReason).toStrictEqual([firstChild])
        expect(group.style.display).toStrictEqual('block')

        // Nothing changed.
        form.updateAllGroups()
        expect(group.shown).toStrictEqual(true)

        firstChild.shown = false
        form.updateAllGroups()
        await timeout()
        expect(group.shown).toStrictEqual(false)
        expect(specification.showReason).toBeNull()
        expect(group.style.display).toStrictEqual('none')

        // Show if indicator overwrites children state.
        specification.showIf = () => true
        specification.showIfExpression = 'true'
        form.updateAllGroups()
        expect(group.shown).toStrictEqual(true)
        expect(specification.showReason).toStrictEqual('true')

        // Empty groups are shown.
        const emptyGroup = createDomNode()
        emptyGroup.setAttribute('data-name', 'empty')
        form.groups = [[emptyGroup, {children: [], showReason: null}]]
        form.updateAllGroups()
        expect(emptyGroup.shown).toStrictEqual(true)
        expect(logDebug).toHaveBeenCalled()
    })
    test('updateGroupContent', (): void => {
        const form = createForm()
        form.inputConfigurations = {a: createInputConfiguration('a', {
            value: 'value'
        })}
        form.inputNames = ['a']

        const group = createDomNode()
        group.innerHTML = '<span>${a.value}</span>'

        form.updateGroupContent(group)

        expect(group.textContent).toStrictEqual('value')
    })
    test('resetInput', async (): Promise<void> => {
        const form = createForm()
        const domNode = createDomNode()
        form.initialData = {a: 'initial'}
        form.inputConfigurations = {
            a: createInputConfiguration('a', {
                domNodes: [domNode], properties: {default: 'default'}
            }),
            b: createInputConfiguration('b', {domNodes: [createDomNode()]})
        }

        expect(await form.resetInput('unknown')).toStrictEqual(false)

        expect(await form.resetInput('a')).toStrictEqual(true)
        expect(domNode.value).toStrictEqual('initial')

        expect(await form.resetInput('a', true)).toStrictEqual(true)
        expect(domNode.value).toStrictEqual('default')

        expect(await form.resetInput('a', null)).toStrictEqual(true)
        expect(domNode.value).toBeNull()

        form.inputConfigurations.b.domNodes[0].value = 'changed'
        expect(await form.resetInput('b', true)).toStrictEqual(true)
        expect(form.inputConfigurations.b.domNodes[0].value).toBeNull()
    })
    test('doReset and reset button handler', async (): Promise<void> => {
        const form = createForm()
        form.inputConfigurations = {
            a: createInputConfiguration('a'), b: createInputConfiguration('b')
        }
        const resetInput = jest.spyOn(form, 'resetInput')
            .mockImplementation((inputName: string) => {
                if (inputName === 'b')
                    return Promise.reject(new Error('failed'))

                return Promise.resolve(true)
            })

        const event = new MouseEvent('click', {cancelable: true})
        await form.doReset(event, true)
        expect(event.defaultPrevented).toStrictEqual(true)
        expect(resetInput).toHaveBeenCalledWith('a', true)
        expect(resetInput).toHaveBeenCalledWith('b', true)
        expect(logWarn).toHaveBeenCalled()

        const doReset = jest.fn(() => Promise.resolve())
        form.doReset = doReset

        form.onClear(event)
        form.onReset(event)
        form.onTruncate(event)
        expect(doReset.mock.calls).toStrictEqual(
            [[event, true], [event, false], [event]]
        )
    })
    test('resetAllHiddenNonPersistentInputs', async (): Promise<void> => {
        const form = createForm()
        form.inputConfigurations = {
            a: createInputConfiguration('a', {shown: false}),
            b: createInputConfiguration(
                'b', {shown: false, valuePersistence: 'persistent'}
            ),
            c: createInputConfiguration('c', {shown: true})
        }
        const resetInput = jest.spyOn(form, 'resetInput')
            .mockImplementation(() => Promise.resolve(true))

        await form.resetAllHiddenNonPersistentInputs()

        expect(resetInput.mock.calls).toStrictEqual([['a']])
    })
    test('onKeyDown', (): void => {
        const form = createForm()
        const doSubmit = jest.fn(() => Promise.resolve())
        form.doSubmit = doSubmit

        const input = createDomNode('input')
        form.appendChild(input)
        const outside = createDomNode('input')

        for (const domNode of [input, outside])
            domNode.addEventListener('keydown', form.onKeyDown)

        input.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyA'}))
        outside.dispatchEvent(new KeyboardEvent('keydown', {code: 'Enter'}))
        expect(doSubmit).not.toHaveBeenCalled()

        input.dispatchEvent(new KeyboardEvent('keydown', {code: 'Enter'}))
        expect(doSubmit).toHaveBeenCalledTimes(1)
    })
    test('getData', (): void => {
        const form = createForm()
        const invalidDomNode = createDomNode()
        invalidDomNode.invalid = true

        form.inputConfigurations = {
            a: createInputConfiguration('a', {
                domNode: invalidDomNode, shown: true, value: 'a'
            }),
            b: createInputConfiguration('b', {
                transformer: (value: unknown) => (value as number) * 2,
                value: 2
            }),
            c: createInputConfiguration('c', {value: null}),
            'd.e': createInputConfiguration('d.e', {value: 'computed'}),
            f: createInputConfiguration(
                'f', {value: [{value: 1}, {value: 2}]}
            ),
            g: createInputConfiguration('g', {value: [1, {value: 2}]}),
            h: createInputConfiguration(
                'h', {dataMapping: 'item.x + 1', value: {x: 1}}
            ),
            i: createInputConfiguration('i', {
                dataMapping: {i1: 'x', i2: 'name'}, value: {x: 5}
            }),
            j: createInputConfiguration('j', {
                domNode: invalidDomNode, shown: false, value: 'j'
            })
        }

        expect(form.getData()).toStrictEqual({
            data: {
                a: 'a', b: 4, f: [1, 2], g: [1, {value: 2}], h: 2,
                i1: 5, i2: 'i', j: 'j'
            },
            invalidInputNames: ['a']
        })

        form.inputConfigurations.k = createInputConfiguration(
            'k', {dataMapping: 'notDefined', value: {}}
        )
        expect(() => form.getData()).toThrow()

        form.inputConfigurations.k = createInputConfiguration(
            'k', {dataMapping: {k: 'notDefined'}, value: {}}
        )
        expect(() => form.getData()).toThrow()
    })
    test('isDeterminedStateValueNeeded', (): void => {
        const form = createForm()

        const check = (
            domNode: Partial<AnnotatedInputDomNode> | undefined,
            value: unknown
        ): boolean => {
            form.inputConfigurations = {a: createInputConfiguration('a', {
                domNode: domNode as AnnotatedInputDomNode, value
            })}

            return form.isDeterminedStateValueNeeded('a')
        }

        expect(check(undefined, 'a')).toStrictEqual(false)
        expect(check({initialValue: 'a'}, 'a')).toStrictEqual(false)
        expect(check({initialValue: 'a'}, 'b')).toStrictEqual(true)
        expect(check({default: 'a'}, 'a')).toStrictEqual(false)
        expect(check({default: 'a'}, 'b')).toStrictEqual(true)
        expect(check({default: null, type: 'boolean'}, undefined))
            .toStrictEqual(false)
        expect(check({default: null, type: 'string'}, undefined))
            .toStrictEqual(true)
        expect(check(
            {default: null, selection: [true, false], type: 'boolean'},
            undefined
        )).toStrictEqual(true)
        expect(check(
            {
                default: null,
                selection: {a: true, b: false} as unknown as Array<unknown>,
                type: 'boolean'
            },
            undefined
        )).toStrictEqual(true)
    })
    test('determineStateURL', (): void => {
        const form = createForm()
        const domNode = createDomNode()
        domNode.dirty = true
        form.inputConfigurations = {
            a: createInputConfiguration('a', {domNode, value: 'value'}),
            'b.c': createInputConfiguration('b.c', {domNode, value: 'value'}),
            d: createInputConfiguration('d', {value: 'no node'})
        }

        // Inputs are not part of the default url configuration mask.
        expect(form.determineStateURL()).toStrictEqual(
            {encoded: document.URL, plain: decodeURI(document.URL)}
        )

        form.resolvedConfiguration.urlConfigurationMask =
            {exclude: false, include: true}
        const serialized = '{"inputs":{"a":{"properties":{"value":"value"}}}}'
        expect(form.determineStateURL()).toStrictEqual({
            encoded:
                `${document.URL}?aForm=${encodeURIComponent(serialized)}`,
            plain: `${document.URL}?aForm=${serialized}`
        })

        // Existing state parameter will be replaced.
        history.replaceState(null, '', '/?aForm={}&b=1')
        expect(form.determineStateURL().plain).toStrictEqual(
            `http://localhost/?b=1&aForm=${serialized}`
        )
        history.replaceState(null, '', '/?b=1&')
        expect(form.determineStateURL().plain).toStrictEqual(
            `http://localhost/?b=1&aForm=${serialized}`
        )

        // Existing url configuration will be updated.
        form.urlConfiguration = {
            inputs: {a: {properties: {value: 'old'}}},
            tags: ['tag']
        }
        expect(form.determineStateURL().plain).toStrictEqual(
            'http://localhost/?b=1&aForm=' +
            '{"inputs":{"a":{"properties":{"value":"value"}}},' +
            '"tag":{"values":["tag"]}}'
        )

        // Too long values will be removed.
        form.resolvedConfiguration.urlConfigurationCharacterLimit = 1
        expect(form.determineStateURL().plain).toStrictEqual(
            'http://localhost/?b=1&aForm={"tag":{"values":["tag"]}}'
        )
    })
})
describe('AgileForm input updates', (): void => {
    /**
     * Creates a form with two inputs depending on each other (as in
     * prototyping mode) whose "disabled" state is derived dynamically.
     * @param deriveX - Derives "x" state from "y" configuration.
     * @param deriveY - Derives "y" state from "x" configuration.
     * @returns Created form.
     */
    const createMutuallyDependentForm = (
        deriveX: (y: InputConfiguration) => unknown,
        deriveY: (x: InputConfiguration) => unknown
    ): AgileForm => {
        const form = createForm()
        form.inputConfigurations = {
            x: createInputConfiguration('x', {
                dependsOn: ['x', 'y'], domNodes: [createDomNode()]
            }),
            y: createInputConfiguration('y', {
                dependsOn: ['x', 'y'], domNodes: [createDomNode()]
            })
        }
        const {x, y} = form.inputConfigurations
        x.dynamicExtend = {disabled: () => deriveX(y)}
        y.dynamicExtend = {disabled: () => deriveY(x)}
        form.createDependencyMapping()

        return form
    }

    test('dependent inputs are updated until nothing changes', async (
    ): Promise<void> => {
        const form = createMutuallyDependentForm(
            () => true, (x: InputConfiguration) => x.properties.disabled
        )

        expect(await form.updateInput('x', new Event('change')))
            .toStrictEqual(true)

        const {x, y} = form.inputConfigurations
        expect(x.properties.disabled).toStrictEqual(true)
        expect(y.properties.disabled).toStrictEqual(true)
        expect(y.domNodes[0].disabled).toStrictEqual(true)
        expect(logError).not.toHaveBeenCalled()
    })
    test('endlessly changing inputs are stopped', async (): Promise<
        void
    > => {
        const form = createMutuallyDependentForm(
            (y: InputConfiguration) => !y.properties.disabled,
            (x: InputConfiguration) => x.properties.disabled
        )
        const updateInput = jest.spyOn(form, 'updateInput')
        const maximumNumberOfChanges =
            AgileForm.maximumNumberOfInputChangesPerUpdate
        AgileForm.maximumNumberOfInputChangesPerUpdate = 20

        try {
            await form.updateInput('x', new Event('change'))

            expect(logError).toHaveBeenCalledTimes(1)
            expect(logError.mock.calls[0].join(' ')).toContain(
                'Stopped updating inputs triggered by event "change" after ' +
                '20 changes'
            )
            expect(logError.mock.calls[0].join(' '))
                .toMatch(/Last changed inputs: "[xy]", "[xy]"/)
            /*
                Each change updates both dependent inputs, so the whole
                cascade has to stop instead of exploding beneath the limit.
            */
            expect(updateInput.mock.calls.length).toBeLessThanOrEqual(
                1 + 2 * (AgileForm.maximumNumberOfInputChangesPerUpdate + 1)
            )

            // A new update starts a new cascade.
            await form.updateAllInputs(new Event('input'))
            expect(logError).toHaveBeenCalledTimes(2)
            expect(logError.mock.calls[1].join(' '))
                .toContain('triggered by event "input"')
        } finally {
            AgileForm.maximumNumberOfInputChangesPerUpdate =
                maximumNumberOfChanges
        }
    })
})
describe('AgileForm network', (): void => {
    test('doRequest succeeds', async (): Promise<void> => {
        const form = createForm()
        const fetch = mockFetch(() => Promise.resolve(createResponse(
            `)]}',{"data": {"a": 1}}`
        )))

        const target: TargetConfiguration = {
            options: {
                body: {b: 2} as unknown as string,
                headers: {
                    Boolean: true as unknown as string,
                    Empty: ' ',
                    Number: 2 as unknown as string,
                    Object: {} as unknown as string,
                    String: 'value'
                },
                method: 'PUT'
            },
            url: 'http://localhost/api'
        }

        const response = await form.doRequest(target)

        expect(response).toHaveProperty('data', {a: 1})
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(target.options?.body).toStrictEqual('{"b":2}')

        const headers = target.options?.headers as Headers
        expect(headers.get('boolean')).toStrictEqual('true')
        expect(headers.get('number')).toStrictEqual('2')
        expect(headers.get('string')).toStrictEqual('value')
        expect(headers.has('empty')).toStrictEqual(false)
        expect(headers.has('object')).toStrictEqual(false)

        // Without options.
        expect(await form.doRequest({url: 'http://localhost/api'}))
            .toHaveProperty('data', {a: 1})
    })
    test('doRequest authentication response', async (): Promise<void> => {
        const form = createForm()
        const events = recordEvents(form, ['serverAuthenticationInvalid'])
        mockFetch(() =>
            Promise.resolve(createResponse('{"result": true}', 401, true))
        )

        expect(await form.doRequest({url: 'http://localhost/api'}, {a: 1}))
            .toHaveProperty('data', {result: true})
        expect(events).toHaveLength(1)
        expect(events[0][1]).toHaveProperty('reference.request', {a: 1})
    })
    test('doRequest fails', async (): Promise<void> => {
        const form = createForm()
        const events = recordEvents(
            form, ['serverEMailAddressInvalid', 'serverUnexpected']
        )

        mockFetch(() => Promise.reject(new Error('offline')))
        expect(await form.doRequest({url: 'http://localhost/api'}))
            .toBeNull()

        mockFetch(() => Promise.resolve(createResponse('no json')))
        expect(await form.doRequest({url: 'http://localhost/api'}))
            .toBeNull()

        mockFetch(() => Promise.resolve(createResponse('{}', 406)))
        expect(await form.doRequest({url: 'http://localhost/api'}))
            .toBeNull()

        expect(events.map(([eventName]) => eventName)).toStrictEqual(
            [
                'serverUnexpected',
                'serverUnexpected',
                'serverEMailAddressInvalid'
            ]
        )
        expect(logWarn).toHaveBeenCalled()
    })
    test('handleValidSubmittedInput without target', async (): Promise<
        void
    > => {
        const form = createForm()
        form.resolvedConfiguration.debug = true
        const events = recordEvents(form, ['validSubmit'])
        const fetch = mockFetch(() => Promise.resolve(createResponse('{}')))

        await form.handleValidSubmittedInput(new Event('submit'), {a: 1})

        expect(events).toHaveLength(1)
        expect(fetch).not.toHaveBeenCalled()
        expect(form.determinedTargetURL).toBeNull()
        expect(form.pending).toStrictEqual(false)
        expect(form.resolvedConfiguration.data).toStrictEqual({a: 1})
    })
    test('handleValidSubmittedInput with target', async (): Promise<
        void
    > => {
        const form = createForm()
        form.inputConfigurations = {
            a: createInputConfiguration('a', {target: 'A'})
        }
        form.createDependencyMapping()
        const url = 'http://localhost/api'
        ;(form.resolvedConfiguration.target as TargetConfiguration).url = url
        const fetch = mockFetch(() => Promise.resolve(createResponse(
            '{"data": {"b": 2}}'
        )))

        await form.handleValidSubmittedInput(new Event('submit'), {a: 1})

        expect(fetch).toHaveBeenCalledTimes(1)
        const [requestedURL, options] =
            fetch.mock.calls[0] as unknown as [string, RequestInit]
        expect(requestedURL).toStrictEqual(url)
        expect(options.body).toStrictEqual('{"A":1}')
        expect(options.method).toStrictEqual('PUT')
        expect(form.determinedTargetURL).toStrictEqual(url)
        expect(form.response).toHaveProperty('data', {b: 2})
        expect(form.latestResponse).toBe(form.response)
        expect(form.pending).toStrictEqual(false)

        // Redirect after successful submit.
        form.resolvedConfiguration.targetActions = {done: {
            code: '', indicator: () => true, name: 'done', target: '#done'
        }}
        await form.handleValidSubmittedInput(new Event('submit'), {a: 1})
        expect(getHash()).toStrictEqual('#done')
        expect(form.pending).toStrictEqual(true)
    })
    test('doSubmit', async (): Promise<void> => {
        const form = createForm()
        const events = recordEvents(form, ['invalidSubmit'])
        const handleValidSubmittedInput =
            jest.spyOn(form, 'handleValidSubmittedInput')
                .mockImplementation(() => Promise.resolve())
        void form.updateReCaptchaToken()

        const event = new MouseEvent('click', {cancelable: true})

        // Pending forms can not be submitted.
        await form.doSubmit(event)
        expect(event.defaultPrevented).toStrictEqual(true)
        expect(form.hasAttribute('submitted')).toStrictEqual(false)

        form.pending = false

        // Invalid inputs.
        const domNode = createDomNode('input')
        domNode.setAttribute('name', 'a')
        domNode.invalid = true
        form.appendChild(domNode)
        form.inputConfigurations = {a: createInputConfiguration('a', {
            domNode, domNodes: [domNode], shown: true, value: 'x'
        })}
        form.inputNames = ['a']

        await form.doSubmit(event)
        expect(form.hasAttribute('submitted')).toStrictEqual(true)
        expect(form.message)
            .toStrictEqual('The following inputs are invalid "a".')
        expect(domNode.showInitialValidationState).toStrictEqual(true)
        expect(form.invalid).toStrictEqual(true)

        // Missing re-captcha challenge.
        domNode.invalid = false
        const reCaptchaFallbackInput = createDomNode()
        reCaptchaFallbackInput.setAttribute('invalid', '')
        form.reCaptchaFallbackInput = reCaptchaFallbackInput
        form.reCaptchaFallbackRendered = true

        await form.doSubmit(event)
        expect(form.hasAttribute('re-captcha-fallback-rendered'))
            .toStrictEqual(true)
        expect(form.message)
            .toStrictEqual('Please do the re-captcha challenge.')

        form.reCaptchaFallbackRendered = false

        // Unsatisfied constraint.
        const constraint = {
            description: 'Need y.', evaluation: 'a.value === "y"'
        }
        form.resolvedConfiguration.constraints = [constraint]

        await form.doSubmit(event)
        expect(form.message).toStrictEqual('Need y.')
        expect(form.invalidConstraint).toStrictEqual(constraint)
        expect(form.submitted).toStrictEqual(false)
        expect(events).toHaveLength(1)
        expect(handleValidSubmittedInput).not.toHaveBeenCalled()

        // Broken constraint.
        form.resolvedConfiguration.constraints =
            [{description: '', evaluation: '('}]
        await form.doSubmit(event)
        expect(logWarn).toHaveBeenCalled()
        form.submitted = false

        // Valid submit into new window.
        form.resolvedConfiguration.constraints = []
        const submitButton = createDomNode('button')
        submitButton.setAttribute('target', '_blank')
        form.submitButtons = [submitButton]

        await form.doSubmit(event)
        expect(form.valid).toStrictEqual(true)
        expect(form.onceSubmitted).toStrictEqual(true)
        expect(form.message).toStrictEqual('')
        expect(handleValidSubmittedInput)
            .toHaveBeenCalledWith(event, {a: 'x'}, true)
    })
    test('initialize', async (): Promise<void> => {
        const form = createForm()
        const events = recordEvents(form, ['initialize', 'initialized'])
        const fetch = mockFetch(() => Promise.resolve(createResponse(
            '{"data": {"a": 1}}'
        )))

        // Nothing to request.
        await form.initialize()
        expect(events.map(([eventName]) => eventName))
            .toStrictEqual(['initialize'])
        expect(fetch).not.toHaveBeenCalled()

        // Successful request.
        const url = 'http://localhost/initialize'
        form.resolvedConfiguration.initializeTarget.url = url

        events.length = 0
        await form.initialize()
        expect(events.map(([eventName]) => eventName))
            .toStrictEqual(['initialize', 'initialized'])
        expect(events[1][1]).toHaveProperty('target.url', url)
        expect(form.initialResponse).toHaveProperty('data', {a: 1})
        expect(form.latestResponse).toBe(form.initialResponse)
        expect(form.pending).toStrictEqual(false)

        // Redirect depending on initial response.
        form.resolvedConfiguration.targetActions = {initialize: {
            code: '',
            indicator: () => true,
            name: 'initialize',
            target: '#initialized'
        }}
        await form.initialize()
        expect(getHash()).toStrictEqual('#initialized')

        // Unsuccessful request.
        mockFetch(() => Promise.resolve(createResponse('{}', 500)))
        events.length = 0
        await form.initialize()
        expect(form.initialResponse).toBeNull()
        expect(events.map(([eventName]) => eventName))
            .toStrictEqual(['initialize'])
        expect(form.pending).toStrictEqual(false)
    })
})
describe('AgileForm rendering', (): void => {
    /**
     * Creates, configures and renders a form with given content.
     * @param content - Inner html of the form.
     * @param configuration - Form configuration.
     * @returns Rendered form.
     */
    const renderForm = async (
        content: string, configuration: Mapping<unknown> = {}
    ): Promise<AgileForm> => {
        const form = document.createElement(name) as AgileForm
        form.innerHTML = content
        form.setAttribute(
            'configuration',
            JSON.stringify({animation: false, ...configuration})
        )
        document.body.appendChild(form)

        /*
            NOTE: Connecting triggers rendering; an additional explicit
            render call would race with it.
        */
        await timeout()
        await form.renderState.promise

        return form
    }

    test('connects configured inputs, groups and actions', async (): Promise<
        void
    > => {
        const form = await renderForm(
            `
                <div class="agile-form__group" name="group"
                    show-if="a.value === 'show'"
                >
                    <input name="b">
                </div>
                <input name="a">
                <div class="agile-form__status-message"></div>
                <button action="double">double</button>
                <button clear>clear</button>
                <button reset>reset</button>
                <button truncate>truncate</button>
                <button submit>submit</button>
            `,
            {
                actions: {double: {code: 'ev * 2'}},
                evaluations: [['ev', '1 + 1']],
                inputs: {
                    a: {properties: {value: 'hide'}},
                    b: {
                        dependsOn: ['a'],
                        dynamicExtendExpressions: {placeholder: 'a.value'},
                        showIfExpression: 'a.value === "show"'
                    },
                    c: {}
                }
            }
        )

        const inputA = form.querySelector('[name="a"]') as HTMLInputElement
        const inputB = form.querySelector('[name="b"]') as HTMLInputElement
        const group = form.querySelector('[name="group"]') as AnnotatedDomNode
        const messageBox = form.querySelector(
            '.agile-form__status-message'
        ) as HTMLElement

        expect(form.inputConfigurations.a.domNode).toBe(inputA)
        expect(form.inputConfigurations.b.domNodes).toStrictEqual([inputB])
        expect(form.initialData).toHaveProperty('a', 'hide')
        expect(form.dependencyMapping.a).toStrictEqual(['b'])
        expect(form.groups).toHaveLength(1)
        expect(form.pending).toStrictEqual(false)

        // Missing configured input "c" is reported.
        expect(form.message).toStrictEqual(
            'Missing input for expected model name "c".'
        )
        expect(messageBox.textContent).toStrictEqual(form.message)

        // Dependent input state.
        expect(inputB.placeholder).toStrictEqual('hide')
        expect(form.inputConfigurations.b.shown).toStrictEqual(false)
        expect(group.shown).toStrictEqual(false)

        // Changing an input updates dependent inputs and groups.
        inputA.value = 'show'
        inputA.dispatchEvent(new Event('change'))
        await timeout(500)
        await timeout()
        expect(form.inputConfigurations.b.shown).toStrictEqual(true)
        expect(inputB.placeholder).toStrictEqual('show')
        expect(group.shown).toStrictEqual(true)

        // Actions.
        ;(form.querySelector('[action="double"]') as HTMLElement).click()
        await timeout()
        await timeout()
        expect(form.actionResults).toHaveProperty('double', 4)

        // Reset buttons.
        ;(form.querySelector('[clear]') as HTMLElement).click()
        await timeout()
        expect(inputA.value).toStrictEqual('')
        ;(form.querySelector('[reset]') as HTMLElement).click()
        await timeout()
        expect(inputA.value).toStrictEqual('hide')

        // Submit.
        const events = recordEvents(form, ['validSubmit'])
        ;(form.querySelector('[submit]') as HTMLElement).click()
        await timeout()
        await timeout()
        expect(events).toHaveLength(1)
        expect(events[0][1]).toHaveProperty('reference.a', 'hide')

        // Disconnecting removes all input bindings.
        expect(Object.keys(form.inputEventBindings))
            .toStrictEqual(['a', 'b', 'c'])
        form.remove()
        expect(form.inputEventBindings).toStrictEqual({})
    })
    test('prototyping mode', async (): Promise<void> => {
        const form = await renderForm(
            '<input name="x"><input name="y"><input>'
        )

        expect(Object.keys(form.inputConfigurations)).toStrictEqual(['x', 'y'])
        expect(form.inputConfigurations.x.dependsOn).toStrictEqual(['x', 'y'])
        expect(form.message)
            .toStrictEqual('Missing attribute "name" for 2. given input.')

        form.remove()
    })
    test('unknown input', async (): Promise<void> => {
        const form = await renderForm(
            '<input name="a"><input name="unknown">', {inputs: {a: {}}}
        )

        expect(Object.keys(form.inputConfigurations)).toStrictEqual(['a'])
        expect(form.message).toStrictEqual(
            'Given input "unknown" not found in current configuration. ' +
            'Expected names are: "a".'
        )

        form.remove()
    })
    test('overlapping render calls', async (): Promise<void> => {
        const form = document.createElement(name) as AgileForm
        form.innerHTML = '<input name="x"><input name="y">'
        form.setAttribute('configuration', '{animation: false}')

        let running = 0
        let maximumRunning = 0
        const processRendering = form.processRendering.bind(form)
        const processRenderingSpy = jest.spyOn(form, 'processRendering')
            .mockImplementation(async (
                reason: string, resolveRendering: boolean
            ) => {
                running += 1
                maximumRunning = Math.max(maximumRunning, running)

                try {
                    await processRendering(reason, resolveRendering)
                } finally {
                    running -= 1
                }
            })

        // Connecting renders by itself; render explicitly at the same time.
        document.body.appendChild(form)
        await Promise.all([form.render('first'), form.render('second')])
        // Wait for the queued, connection-triggered render cycle as well.
        await timeout()
        await form.lock.acquire('render')
        await form.lock.release('render')

        expect(maximumRunning).toStrictEqual(1)
        expect(processRenderingSpy).toHaveBeenCalledTimes(3)
        expect(Object.keys(form.inputConfigurations)).toStrictEqual(['x', 'y'])
        expect(form.pending).toStrictEqual(false)

        form.remove()
    })
    test('rendering can be prevented', async (): Promise<void> => {
        const form = createForm()
        form.innerHTML = '<input name="x">'
        const events = recordEvents(form, ['initialize'])

        let renderEvent: Event | null = null
        form.addEventListener('render', (event: Event) => {
            renderEvent = event
            event.preventDefault()
        })

        await form.render()

        expect(renderEvent).toHaveProperty('cancelable', true)
        expect(form.inputConfigurations).toStrictEqual({})
        expect(form.pending).toStrictEqual(true)
        expect(events).toHaveLength(0)
    })
    test('rendering can be disabled', async (): Promise<void> => {
        const form = createForm()
        const events = recordEvents(form, ['initialize'])

        AgileForm.doRender = false
        try {
            await form.render()
        } finally {
            AgileForm.doRender = true
        }

        expect(form.pending).toStrictEqual(true)
        expect(events).toHaveLength(0)
    })
})
