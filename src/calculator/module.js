/**
 * Calculator Module
 */
import CalculatorRoutes from './routes/calculator';

import * as calculator from './directives/calculator';
import * as calculatorFactory from './services/calculator';
import * as sharebuttons from './directives/sharebuttons';


angular
    .module('Calculator', [])
    .config(CalculatorRoutes)

    .controller('calculatorController', calculator.controller)
    .directive('calculator', calculator.directive)
    .factory('Calculator', calculatorFactory.factory)

    .directive('sharebuttons', sharebuttons.directive);
