export default function CalculatorRoutes($stateProvider) {
    $stateProvider
        .state('calculator', {
            url: '/returncalculator',
            auth: {public: true},
            controller: 'calculatorController',
            views: {
                '': {
                    templateUrl: '/src/calculator/views/layout.html',
                },
                'content@calculator': {
                    templateUrl: '/src/calculator/views/index.html'
                },
            },
        });
}

CalculatorRoutes.$inject = ['$stateProvider'];
