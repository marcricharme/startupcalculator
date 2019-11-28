
export function controller(Calculator, $http, $filter, $scope, $analytics, $cookies) {
    let _this = this;
    let filters = {
        USNumber: $filter('USNumber'),
        thousands: $filter('thousands'),
        singleDigitPercentage: $filter('singleDigitPercentage')
    };
    this.nInputs = 11;
    this.inputs = {};
    let previousHaircut = 1;

    this.resetInputs = function() {
        this.inputs = {
            revenueProjections: [0],
            cogsProjections: [0],
            opexProjections: [0],
            currentRound: 0,
            optionPool: 0,
            preMoney: 0,
            nextRound: 0,
            nextRoundPreMoney: 0,
            salesMultiple: 0,
            investment: 0,
            haircut: 100,
        };
        previousHaircut = 1;
    };

    this.setProjections = function(n) {
        this.inputs.projections = n;
        this.inputs.revenueProjections = new Array(n);
        this.inputs.cogsProjections = new Array(n);
        this.inputs.opexProjections = new Array(n);

        //this.buildTest();
    };

    /**
     * -== TEST ==-
     * Build test case (from spreadsheet)
     */
    this.buildTest = function() {
        let projections = 5;
        this.inputs.revenueProjections = [1173000, 6795000, 21971000, 46129000, 66288000];
        //this.inputs.cogsProjections = [122700, 314400, 1068200, 2450600, 2288900];
        //this.inputs.opexProjections = [1227000, 3144000, 10682000, 24506000, 22889000];
        this.inputs.currentRound = 500000;
        this.inputs.optionPool = 0;
        this.inputs.preMoney = 12000000;
        this.inputs.nextRound = 2000000;
        this.inputs.nextRoundPreMoney = 15000000;
        this.inputs.salesMultiple =  1;
        this.inputs.investment = 500000;
    };


    /**
     * Calculation
    */

    // initialize results
    this.results = {
        revenueProjections: [0],
        cogsProjections: [0],
        grossProfitProjections: [0],
        opexProjections: [0],
        ebitdaProjections: [0],
        exitYear: 0,
        salesMultiple: 0,
        enterpriseValue: 0,
        currentInterestValue: 0,
        currentInvestmentValue: 0,
        IRR: 0,
        cashReturn: 0,
        investment: 0,
        optionPool: 0,
        preMoney: 0,
        postMoney: 0,
        currentInterest: 0,
        nextRound: 0,
        nextRoundPreMoney: 0,
        nextRoundPostMoney: 0,
        currentValuation: 0,
    };

    this.calculate = (_inputs) => {
        _this.inputs = Object.assign({}, _this.inputs, _inputs);
        _this.results = Calculator(_this);
    };

    /**
     * Email results
    */
    this.sendResults = () => {
        let data = {
            results: {
                investment: filters.USNumber(this.results.investment),
                currentInvestmentValue: filters.USNumber(this.results.currentInvestmentValue),
                currentInvestorInvestmentValue: filters.USNumber(this.results.currentInvestorInvestmentValue),
                exitYear: this.results.exitYear,
                salesMultiple: this.results.salesMultiple,
                enterpriseValue: filters.USNumber(this.results.enterpriseValue),
                IRR: filters.singleDigitPercentage(this.results.IRR),
                cashReturn: this.results.cashReturn,
                revenueProjection: filters.USNumber(this.results.revenueProjections[this.results.revenueProjections.length-1])
            },
            recipient: this.inputs.recipient,
            company: this.inputs.company,
            firstName: this.inputs.firstName,
        };

        return $http.post('/api/calculator/send', data);
    };

    /**
     * Mailchimp subscription
    */
    this.subscribe = (email) => {
        return $http.post('/api/calculator/subscribe', {
            recipient: email,
            firstName: this.inputs.firstName,
            lastName: this.inputs.lastName,
            founder: this.inputs.isFounder,
            investor: this.inputs.isInvestor,
            hs_context: {
                hutk: $cookies.get('hubspotutk'),
                pageUrl: "members.1000angels.com/returncalculator",
                pageTitle: "Return Calculator"
            }
        });
    };

    /**
     * Kissmetrics
    */
    this.analytics = {
        track: (e) => {
            $analytics.eventTrack(e);
        },
        identify: (s) => {
            $analytics.setUsername(s);
        },
        set: (obj) => {
            $analytics.setUserProperties(obj);
        }
    };

}

controller.$inject = ['Calculator', '$http', '$filter', '$scope', '$analytics', '$cookies'];

/**
 *
 */
export function directive() {

    function calculatorLink (scope, elem, attrs, calculator) {

        let shadeEl = $('.shade');
        let inputsFooterEl = $('#inputs-footer');
        let resultsEl = $('#results');

        /**
        * Navigation
        */
        const skippable = [3,4,7,8];
        let skipped = 0;
        let transitioning = false;
        // -> cache slides
        let _inputs = [];
        for (let i = 0; i<calculator.nInputs; i++) {
            _inputs[i] = $("#input-" + (i+1));
        }
        _inputs[calculator.nInputs] = $("#user-info");
        // -> cache arrows
        let arrows = [$("#arrow-up"), $("#arrow-down")];
        // -> navigation control
        let currentInput = 0;
        let lastInput = 0;
        let progress = 0;
        scope.progress = "0%";

        let setArrows = (n) => {
            if(n === 0) {
                arrows[0].fadeOut();
            }
            else if (n !== 0) {
                arrows[0].fadeIn();
                if (n < lastInput) arrows[1].fadeIn();
                else arrows[1].fadeOut();
            }
        };

        // --> input validation
        let validateInputs = () => {
            let textInputs = _inputs[currentInput].find('input[type=text]');
            let numberInputs = _inputs[currentInput].find('input[type=number]');
            let FieldsExist = textInputs.length > 0 || numberInputs.length > 0;
            let values = FieldsExist ? Array.concat(...textInputs, ...numberInputs) : [];
            let valid = false;
            if (!values.length) return true;
            values.map((val, i) => {
                valid = parseInt(val.value) > 0;
            });
            return valid;
        };

         scope.start = () => {
             $("#landing").fadeOut("fast", function() {
                 shadeEl.show();
                 inputsFooterEl.show();
                 _inputs[0].fadeIn();
                 window.location.hash = 1;
             });
             calculator.analytics.track("started");
         };

         scope.next = (n) => {
             if (transitioning) return;
             transitioning = true;
             n = skipped = n || 1;
             if(!validateInputs() && skippable.indexOf(currentInput + 1) === -1) {
                 _inputs[currentInput].find(".invalid-input").fadeIn("fast");
                 transitioning = false;
             }
             else {
                 _inputs[currentInput].fadeOut("fast", function() {
                     currentInput += n;
                     lastInput = Math.max(lastInput, currentInput);
                     window.location.hash = currentInput+1;
                     progress = progress != 100 ? parseInt(((lastInput) / calculator.nInputs)*100) : progress;
                     scope.progress =  progress + "%";
                     scope.$apply();
                     setArrows(currentInput);
                     if (currentInput === calculator.nInputs) {
                         $("#user-info").fadeIn("fast");
                     }
                     else {
                          _inputs[currentInput].fadeIn("fast", () => {
                              let input = _inputs[currentInput].find('input[type=text]')[0];
                              if (input) input.focus();
                          });
                     }
                     calculator.analytics.track("question-" + currentInput);
                     transitioning = false;
                });
             }
        };

        scope.previous = (n) => {
            n = n || skipped || 1;
            if (transitioning) return;
            transitioning = true;
            let backFromResults = currentInput === 12;
            let el;
            if (currentInput === calculator.nInputs) {
                el = $("#user-info");
            }
            else el = !backFromResults ? _inputs[currentInput] : resultsEl;

            el.fadeOut("fast", function() {
                 currentInput -= n;
                 setArrows(currentInput);
                 window.location.hash = currentInput+1;
                _inputs[currentInput].fadeIn("fast");
                if (backFromResults) {
                    inputsFooterEl.show();
                    shadeEl.show();
                }
                transitioning = false;
            });
            calculator.analytics.track("previous question");
        };

        scope.skip = (n, nInput) => {
            scope.next(n);
            setArrows(currentInput);
            calculator.analytics.track("skipped to " + currentInput);
        };

        scope.restart = () => {
            resultsEl.fadeOut("fast", function() {
                shadeEl.show();
                inputsFooterEl.show();
                $('.selected').removeClass('selected');
                _inputs[0].fadeIn();
            });
            currentInput = lastInput = progress = scope.progress = scope.projections = 0;
            setArrows(0);
            resultsSentEl.fadeOut("fast", () => sendBtn.fadeIn("fast"));
            calculator.resetInputs();
            calculator.analytics.track("restarted");
        };

        scope.setProjections = (n) => {
            scope.projections = new Array(n);
            calculator.setProjections(n);
            scope.next();
        };

        // -> support for back and forward navigation
        window.onhashchange = () => {
            let hash = window.location.hash.substring(1) || 0;
            let qNumber = parseInt(hash);
            if(!qNumber) return;
            else {
                if (qNumber != (currentInput+1)) {
                    if (qNumber <= (lastInput+1)) {
                        if (resultsEl.is(":visible")) resultsEl.fadeOut("fast");
                        let steps = Math.abs(qNumber - (currentInput+1));
                        if (qNumber > currentInput) scope.next(steps);
                        else scope.previous(steps);
                    }
                    else {
                        window.location.hash = '';
                    }
                }
            }
        };

        // Rm zeros on focus
        scope.focused = (e) => {
            let el = $(e.target);
            if (el.val() === '0') el.val('');
        };

        /**
         * Results
         */
        scope.getResults = () => {
            let warning = $("#user-info-warning");
            let firstname = $("#user-firstname").val();
            let lastname = $("#user-lastname").val();
            let email = $("#user-email").val();
            let validate = (email) => {
                let re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            };
            let valid = ((firstname.length > 2) && (lastname.length > 2) && (calculator.inputs.isFounder || calculator.inputs.isInvestor) && validate(email));
            if(valid) {
                $("#user-info").fadeOut("fast", function() {
                    currentInput += 1;
                    lastInput += 1;
                    shadeEl.hide();
                    inputsFooterEl.hide();
                    resultsEl.fadeIn("fast");
                    calculator.calculate();
                    scope.$apply();
                    calculator.inputs.recipient = email;
                    window.location.hash = '';
                    // update sliders
                    salesMultipleSlider.slider({ value: calculator.results.salesMultiple });
                    haircutSlider.slider({ value: 100 });
                    $("#salesMultipleSliderValue").text(calculator.results.salesMultiple + 'X');
                    $("#haircutSliderValue").text('100%');
                    // kissmetrics
                    calculator.analytics.track("calculated");
                    calculator.analytics.identify(email);
                    calculator.analytics.set({ firstname: firstname });
                    calculator.analytics.set({ lastname: lastname });
                    // subscribe to mailchimp list
                    calculator.subscribe(email);
                });
            }
            else {
                warning.show();
            }
        };

        let sendBtn = $('#extract button');
        let resultsSentEl = $('#results-sent');
        scope.sendResults = () => {
            calculator.sendResults().then((res) => {
                sendBtn.fadeOut("fast", () => resultsSentEl.fadeIn("fast"));
            });
        };


        /**
         * Style
         */
        scope.getProgressBarStyle = () => {
            return 'background: -moz-linear-gradient(left, rgba(74,193,173,1) ' + (progress-20) + '%, rgba(238,238,238,1) ' + (progress*2) + '%);background: -webkit-gradient(left top, right top, color-stop(' + (progress-20) + '%, rgba(74,193,173,1)), color-stop(' + (progress*2) + '%, rgba(238,238,238,1)));background: -webkit-linear-gradient(left, rgba(74,193,173,1) ' + (progress-20) + '%, rgba(238,238,238,1) ' + (progress*2) + '%);background: -o-linear-gradient(left, rgba(74,193,173,1)' + (progress-20) + '%, rgba(238,238,238,1) ' + (progress*2) + '%);background: -ms-linear-gradient(left, rgba(74,193,173,1) ' + (progress-20) + '%, rgba(238,238,238,1) 100%);background: linear-gradient(to right, rgba(74,193,173,1) ' + (progress-20) + '%, rgba(238,238,238,1) ' + (progress*2) + '%);';
        };

        scope.getProgressPos = () => {
            if (progress > 10) return 'left: calc(' + (progress) + "% - " + (50 * parseInt(progress/100)) + "px);";
            else return 'left: calc(' + (progress) + "%);";
        };

        scope.getCurrentProFormaWidth = () => {
            if (!calculator.results.nextRound) return 'width: 100%;';
        };



        /**
         * Tooltips
         */
        let tooltipAnchors = $('.tooltip-anchor');
        let ttip = $('.ttip');
        let tooltip;
        let tooltipTo;

        tooltipAnchors.mouseover(function(e) {
            clearTimeout(tooltipTo);
            let el = $(this);
            let pos = el.position();
            let width = el.width();
            let left = ((width/2) + pos.left) - 150;
            let ttipId = el.attr('data-ttip');
            if(ttipId) {
                tooltip = $('#ttip-' + ttipId);
            }
            else {
                tooltip = el.parent().parent().find('.ttip');
            }
            tooltip.css("left", left + "px");
            tooltip.slideDown("fast");
            tooltip.mouseover(() => {
                clearTimeout(tooltipTo);
            });
            tooltip.mouseout(() => {
                clearTimeout(tooltipTo);
                tooltipTo = setTimeout(() => ttip.slideUp("fast"), 500);
            });
            calculator.analytics.track("tooltip");
        });

         tooltipAnchors.mouseout(() => {
             clearTimeout(tooltipTo);
             let el = $(this);
             let ttipId = el.attr('data-ttip');
             if(ttipId) {
                 tooltip = $('#ttip-' + ttipId);
             }
             else {
                 tooltip = el.parent().parent().find('.ttip');
             }
             tooltipTo = setTimeout(() => ttip.slideUp("fast"), 500);
         });

         ttip.click(function(e) {
             $(this).slideUp("fast");
         });

        /**
         * Sliders
         */
        let haircutSlider = $( "#haircutSlider" ).slider({
            min: 50,
            max: 100,
            step: 5,
            value: 100,
            slide: function( event, ui ) {
                $("#haircutSliderValue").text(ui.value + '%');
                calculator.analytics.track("slider haircut");
            }
        });
        let salesMultipleSlider = $("#salesMultipleSlider").slider({
            min: 1,
            max: 10,
            step: 1,
            slide: function( event, ui ) {
                $("#salesMultipleSliderValue").text(ui.value + 'X');
                calculator.analytics.track("slider sales multiple");
              }
        });


        scope.updateCalculation = () => {
            let haircut = haircutSlider.slider("value");
            let salesMultiple = salesMultipleSlider.slider("value");
            calculator.calculate({
                haircut: haircut,
                salesMultiple: salesMultiple,
            });
            window.scrollTo(0, 378);
            calculator.analytics.track("updated calculation");
        };

    }

    return {
        restrict: 'E',
        controller: 'calculatorController',
        controllerAs: 'Calculator',
        bindToController: true,
        link: calculatorLink,
        templateUrl: '/src/calculator/views/directives/calculator.html'
    };
}
