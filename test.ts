// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
'use strict'
/* !
    region header
    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import {describe, expect, test} from '@jest/globals'
import Tools, {globalContext} from 'clientnode'
import nodeFetch from 'node-fetch'

import api, {AgileForm} from './index'
import {Configuration} from './type'
// endregion
globalContext.fetch = nodeFetch as unknown as typeof fetch

const name = 'test-form'
api.register(name)

describe('api', ():void => {
    test('api definitions', ():void => {
        expect(api).toBeDefined()
        expect(api).toHaveProperty('component', AgileForm)

        expect(document.createElement(name)).toBeInstanceOf(AgileForm)
    })
})
describe('AgileForm', ():void => {
    test('custom element definition', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        expect(form).toBeDefined()
    })
    test('attribute configuration', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        form.setAttribute('configuration', '{value: 2}')

        expect(form).toHaveProperty('configuration.value', 2)
        expect(form).toHaveProperty('resolvedConfiguration.value', 2)
    })
    test('input connections', async ():Promise<void> => {
        const form:AgileForm = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        expect(form).toHaveProperty('inputConfigurations', {})

        const input:HTMLElement = document.createElement('generic-input')
        const inputName = 'test'
        input.setAttribute('name', inputName)
        form.appendChild(input)
        await form.render()

        expect(form.inputConfigurations).toHaveProperty('test.domNode', input)
        expect(form.inputConfigurations)
            .toHaveProperty('test.domNodes', [input])
        expect(form.inputConfigurations).toHaveProperty('test.dependsOn', null)
        expect(form.inputConfigurations).toHaveProperty('test.name', 'test')
        expect(form.inputConfigurations).toHaveProperty('test.properties', {})
        expect(form.inputConfigurations).toHaveProperty('test.shown', true)

        form.resolvedConfiguration.inputs[inputName] = {}
        await form.render()
        expect(form.inputConfigurations)
            .toHaveProperty([inputName, 'domNode'], input)
    })
    // region configuration
    test('normalizeURLConfiguration', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm

        expect(form.self.normalizeURLConfiguration({})).toStrictEqual({})

        expect(
            form.self.normalizeURLConfiguration({a: 2} as
                unknown as
                Configuration
        )).toStrictEqual({a: 2})

        // TODO
    })
    test('normalizeConfiguration', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm

        expect(form.self.normalizeConfiguration({})).toStrictEqual({
            evaluations: [], expressions: [], tag: {values: []}
        })

        expect(form.self.normalizeConfiguration({
            evaluations: '5',
            expressions: '4',
            tags: 'tag-a'
        } as unknown as Configuration)).toStrictEqual({
            evaluations: ['5'],
            expressions: ['4'],
            tag: {values: ['tag-a']}
        })

        expect(form.self.normalizeConfiguration({
            evaluations: '5',
            expressions: ['4'],
            tag: {values: 'tag-a'},
            tags: ['tag-b']
        } as unknown as Configuration)).toStrictEqual({
            evaluations: ['5'],
            expressions: ['4'],
            tag: {values: ['tag-a', 'tag-b']}
        })

        expect(form.self.normalizeConfiguration({
            evaluations: [],
            expressions: ['4'],
            tag: {values: ['tag-a', 'tag-c']},
            tags: ['tag-b']
        } as unknown as Configuration)).toStrictEqual({
            evaluations: [],
            expressions: ['4'],
            tag: {values: ['tag-a', 'tag-c', 'tag-b']}
        })
    })
    test('mergeConfiguration', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm

        const initialConfiguration:Configuration =
            Tools.copy(form.resolvedConfiguration)

        form.mergeConfiguration({})
        expect(form.resolvedConfiguration).toStrictEqual(initialConfiguration)

        form.mergeConfiguration({a: 2})
        expect(form.resolvedConfiguration)
            .toStrictEqual({...initialConfiguration, a: 2})

        form.mergeConfiguration({evaluations: '2'})
        expect(form.resolvedConfiguration.evaluations).toStrictEqual(
            initialConfiguration.evaluations.concat('2')
        )
    })
    test('resolveConfiguration', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm

        const initialConfiguration:Configuration =
            Tools.copy(form.resolvedConfiguration)

        form.resolveConfiguration()
        expect(form.resolvedConfiguration).toStrictEqual(initialConfiguration)

        form.additionalConfiguration = {a: 2}
        form.resolveConfiguration()
        expect(form.resolvedConfiguration)
            .toStrictEqual({...initialConfiguration, a: 2})
    })
    test('getConfigurationFromURL', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm

        const initialConfiguration:Configuration =
            Tools.copy(form.resolvedConfiguration)

        expect(form.getConfigurationFromURL()).toStrictEqual(null)

        form.queryParameters[form.resolvedConfiguration.name] = '{}'
        expect(Object.keys(form.getConfigurationFromURL()))
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
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
