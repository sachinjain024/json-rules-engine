'use strict'

import engineFactory from '../src/index'

describe('Engine: event', () => {
  let engine

  let event = {
    type: 'setDrinkingFlag',
    params: {
      canOrderDrinks: true
    }
  }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  beforeEach(() => {
    engine = engineFactory()
    let determineDrinkingAgeRule = factories.rule({ conditions, event, priority: 100 })
    engine.addRule(determineDrinkingAgeRule)
    engine.addFact('age', 21)
  })

  it('passes the event type and params', (done) => {
    engine.on('success', function (a, engine) {
      try {
        expect(a).to.eql(event)
        expect(engine).to.eql(engine)
      } catch (e) { return done(e) }
      done()
    })
    engine.run()
  })

  it('emits using the event "type"', (done) => {
    engine.on('setDrinkingFlag', function (params, engine) {
      try {
        expect(params).to.eql(event.params)
        expect(engine).to.eql(engine)
      } catch (e) { return done(e) }
      done()
    })
    engine.run()
  })

  it('allows facts to be added by the event handler, affecting subsequent rules', () => {
    let drinkOrderParams = { wine: 'merlot', quantity: 2 }
    let drinkOrderEvent = {
      type: 'offerDrink',
      params: drinkOrderParams
    }
    let drinkOrderConditions = {
      any: [{
        fact: 'canOrderDrinks',
        operator: 'equal',
        value: true
      }]
    }
    let drinkOrderRule = factories.rule({
      conditions: drinkOrderConditions,
      event: drinkOrderEvent,
      priority: 1
    })
    engine.addRule(drinkOrderRule)
    return new Promise((resolve, reject) => {
      engine.on('success', function (event, almanac) {
        switch (event.type) {
          case 'setDrinkingFlag':
            almanac.addRuntimeFact('canOrderDrinks', event.params.canOrderDrinks)
            break
          case 'offerDrink':
            expect(event.params).to.eql(drinkOrderParams)
            break
          default:
            reject(new Error('default case not expected'))
        }
      })
      engine.run().then(resolve).catch(reject)
    })
  })
})
