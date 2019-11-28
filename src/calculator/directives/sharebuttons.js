/**
 *
 */
export function directive() {

    return {
        restrict: 'E',
        template: `
            <div id="share">
                <span id="helptext">SHARE</span>
                <a href="mailto:%20?body=members.1000angels.com%2Freturncalculator&subject=Startup+Investment+Return+Calculator">
                    <span class="fa fa-icon fa-envelope"></span>
                </a>
                <a href="http://www.linkedin.com/shareArticle?mini=true&url=members.1000angels.com%2Freturncalculator&title=1000Angels+Startup+Investment+Return+Calculator&source=1000angels.com&summary=Answer a few simple questions, and in seconds know if that startup investment opportunity is a winner or just totally over-priced. Leverage the calculator in fundraising conversations to understand what potential IRR and Cash on Cash return you could make." onclick="javascript:window.open(this.href,'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;">
                    <span class="fa fa-icon fa-linkedin-square"></span>
                </a>
                <a href="http://twitter.com/home?status=Pretty+neat+startup+investment+return+calculator+from+@_1000_Angels+for+founders+and+investors+http:%2F%2Fbit.ly%2F1UhXId5+Highly+recommend+it!" onclick="javascript:window.open(this.href,'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;">
                    <span class="fa fa-icon fa-twitter-square"></span>
                </a>
                <a href="http://www.facebook.com/share.php?u=members.1000angels.com%2Freturncalculator" onclick="javascript:window.open(this.href,'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;">
                    <span class="fa fa-icon fa-facebook-square"></span>
                </a>
            </div>
        `,
    };
}

directive.$inject = [];
