/**
 *
 */
export function factory() {

    /**
     *  IRR calculation
     */
    function IRR(investment, cashflows) {
        var d = new Date();
        let guess = 0.1;
        function NPV(rate) {
            let irrSum = 0;
            for(let i=0; i<cashflows.length; i++) {
                irrSum += cashflows[i] / (Math.pow(1+rate, (i+1)));
            }
            return irrSum;
        }
        let npv;
        let iter = 0;
        let variation = 0;
        do {
            iter++;
            npv = investment + NPV(guess);
            // set variation, it gets more accurate as it gets closer to 0
            if (Math.abs(npv) > 10000) variation = 0.01;
            else if (Math.abs(npv) > 1000) variation = 0.001;
            else if (Math.abs(npv) > 100) variation = 0.0001;
            else variation = 0.00001;

            if (npv < 0) guess -= variation;
            if (npv > 0) guess += variation;

            //console.log("npv", npv);
            //console.log("guess", guess);
            //console.log("iter", iter);

        } while (Math.abs(npv) > 10 && iter < 1000);

        var df = new Date();

        //console.log("seconds: ", (df-d)/1000);

        return guess;
    }



    return function(instance) {
        let inputs = instance.inputs;
        //console.log("inputs", inputs);
        let previousHaircut = instance.previousHaircut || 1;
        inputs.optionPool = inputs.optionPool || 0;
        let results = {};
        /**
         * RECALCULATE
         */
        // Investment can't be higher than the current round
        if(inputs.altInvestment > 0 && inputs.altInvestment != inputs.investment) {
            if(inputs.altInvestment > inputs.currentRound) inputs.altInvestment = inputs.currentRound;
            inputs.investment = inputs.altInvestment;
        }

        /**
         * HAIRCUT
         */
        let haircut = inputs.haircut ? (inputs.haircut / 100) : 1;
        inputs.revenueProjections = inputs.revenueProjections.map((amount) => (amount/previousHaircut) * haircut);
        instance.previousHaircut = haircut;

        /**
         * EXIT VALUES
         */
        results.exitYear = inputs.projections;
        results.salesMultiple = inputs.salesMultiple || 1;
        results.haircut = inputs.haircut || 100;

        results.postMoney = ((inputs.preMoney + inputs.currentRound)/(1 - (inputs.optionPool/100)));

        let lastYearRevenue = inputs.revenueProjections[inputs.revenueProjections.length-1];
        results.enterpriseValue = lastYearRevenue * results.salesMultiple;
        results.bridgeInterest = inputs.currentRound / results.postMoney;
        results.bridgeInvestorInterest = inputs.investment / results.postMoney;
        if(inputs.nextRound) {
            results.nextRoundPostMoney = inputs.nextRoundPreMoney + inputs.nextRound;
            results.currentInterestValue = (results.bridgeInterest * inputs.nextRoundPreMoney) / results.nextRoundPostMoney;
            results.currentInvestorInterestValue = (results.bridgeInvestorInterest * inputs.nextRoundPreMoney) / results.nextRoundPostMoney;
        }
        else {
            results.currentInterestValue = results.bridgeInterest;
            results.currentInvestorInterestValue = results.bridgeInvestorInterest;
        }

        results.currentInvestmentValue = results.currentInterestValue * results.enterpriseValue;
        results.currentInvestorInvestmentValue = results.currentInvestorInterestValue * results.enterpriseValue;

        let cashflows = [];
        for (let i=1; i<inputs.projections; i++) {
            cashflows.push(0);
        }
        cashflows.push(results.currentInvestmentValue);
        results.IRR = IRR(-inputs.currentRound, cashflows);

        results.cashReturn = (results.currentInvestorInvestmentValue / inputs.investment).toFixed(1);

        inputs.altInvestment = inputs.investment;
        /**
         * COMPANY FINANCIAL PROJECTIONS
         */
        results.revenueProjections = inputs.revenueProjections;
        results.cogsProjections = inputs.cogsProjections;
        results.opexProjections = inputs.opexProjections;
        results.grossProfitProjections = [];
        results.ebitdaProjections = [];
        results.displayCogs = false;
        results.displayOpex = false;
        for (let i=0; i<inputs.projections; i++) {
            let cogs = results.cogsProjections[i];
            let opex = results.opexProjections[i];
            let grossProfit = results.revenueProjections[i] - (cogs || 0);
            let ebitda = grossProfit - (opex || 0);
            if (cogs) {
                results.displayCogs = true;
            }
            if (opex) {
                results.displayOpex = true;
            }
            results.grossProfitProjections.push(grossProfit);
            results.ebitdaProjections.push(ebitda);
        }
        /**
         * PRO FORMA CURRENT ROUND
         */
        results.investment = inputs.investment;
        results.currentRound = inputs.currentRound;
        results.optionPool = inputs.optionPool;
        results.preMoney = inputs.preMoney;
        results.currentInterest = results.bridgeInterest;
         /**
          * PRO FORMA FUTURE ROUND
          */
        results.nextRound = inputs.nextRound;
        results.nextRoundPreMoney = inputs.nextRoundPreMoney;
        results.currentValuation = results.currentInterestValue * results.nextRoundPostMoney;

        //console.log("results", results);

        return results;


    };

}
