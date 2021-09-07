// ==UserScript==
// @name            Anti-Cookies Consent
// @namespace       Anti-Cookies-Consent
// @version         1.0
// @description     Remove Cookies Consent Modal Windows
// @author          Elwyn
// @license         MIT
// @homepage        https://github.com/WakeupNeo33/Anti-Cookies-Consent-userscript
// @supportURL      https://github.com/WakeupNeo33/Anti-Cookies-Consent-userscript/issues
// @downloadURL     https://github.com/WakeupNeo33/Anti-Cookies-Consent-userscript/raw/main/anti-cookies-consent.user.js
// @updateURL       https://github.com/WakeupNeo33/Anti-Cookies-Consent-userscript/raw/main/anti-cookies-consent.user.js
// @iconURL         https://github.com/WakeupNeo33/Anti-Cookies-Consent-userscript/raw/main/icon.png
// @include         *
// @noframes
// @run-at          document-start
// @grant           unsafeWindow
// ==/UserScript==
(function() {

	var enable_debug = true;

    // Anti-AdBlocker Pattern to Search
    var cookies_pattern = /cookies/i;

    var tagNames_pattern = /div|section|iframe/i;


    // HELPER Functions
    //-----------------
    function debug( msg, val ) {
        if ( !enable_debug ) return;
        console.log( '%c ANTI-COOKIES CONSENT','color: white; background-color: blue', msg );
        if ( val !== undefined )
        {
            if ( val.nodeType === Node.ELEMENT_NODE ) {
                console.log ( 'TagName: ' + val.tagName + ' | Id: ' + val.id + ' | Class: ' + val.classList );
            } else {
                console.log ( val );
            }
        }
    }

    function addStyle(str) {
        var style = document.createElement('style');
        style.innerHTML = str;
        document.body.appendChild( style );
    }

    /* Thanks to RuiGuilherme  */
    const enableContextMenu = () => {
        window.addEventListener('contextmenu', (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation();
        }, true);
    }

    function isElementBlur( el )
    {
        var style = window.getComputedStyle( el );
        var filter = style.getPropertyValue( 'filter' );
        return ( (/blur/i).test( filter ) );
    }

    function isElementFixed( el )
    {
        var style = window.getComputedStyle( el );
        return ( style.getPropertyValue( 'position' ) == 'fixed' );
    }

    function isOverflowHidden( el )
    {
        var style = window.getComputedStyle( el );
        return ( style.getPropertyValue( 'overflow' ) == 'hidden' );
    }

    function isBlackoutModal( el )
    {
        var style = window.getComputedStyle( el );
        var position = style.getPropertyValue( 'position' );
        var top = parseInt( style.getPropertyValue( 'top' ) );
        var left = parseInt( style.getPropertyValue( 'left' ) );
        var right = parseInt( style.getPropertyValue( 'right' ) );
        var bottom = parseInt( style.getPropertyValue( 'bottom' ) );
        var zindex = style.getPropertyValue( 'z-index' );
        if ( isNaN( zindex ) ) zindex = 0;
        return parseInt( zindex ) > 1 && position == 'fixed' && ( ( el.offsetHeight > window.innerHeight - 50 && el.offsetWidth > window.innerWidth - 20 ) || (top == 0 && left == 0 && right == 0 && bottom == 0) );
    }

    function isModalWindows( el )
    {
        return isElementFixed ( el ) && ( cookies_pattern.test( el.textContent ) || isBlackoutModal( el ) || el.tagName == 'IFRAME' );
    }

    // Main Functions
    function checkModals()
    {
        debug( 'Checking Modals' );
        var modalFound = false;
        // Only check common used html tag names
        document.querySelectorAll( 'div,section,iframe' ).forEach( ( el ) => {
            if ( isModalWindows( el ) )
            {
                modalFound = true;
                removeModal( el );
            }
            else if ( isElementBlur( el ) )
            {
                debug( 'Blur Element Detected & Deblurred: ', el);
                el.classList.add( 'un_blur' );
            }
        });

        if ( modalFound )
        {
            unblockScroll();
        }
    }

    function removeModal( el )
    {
        // Skip the already processed elements
        if ( /hide_modal/.test( el.classList ) ) {
            return;
        }

        // Hide the element through a high priority incorporating the sentence in the style parameter
        el.setAttribute('style', (el.getAttribute('style')||'') + ';display: none !important;');

        // Also, add the random class name to the element
        // (in case there is a script that eliminates the previous statement)
        el.classList.add( 'hide_modal' );

        debug( 'Modal Detected & Removed: ', el);
    }

    function unblockScroll()
    {
        var htmlTag = document.getElementsByTagName('html')[0];
        if ( isOverflowHidden( document.body ) )
        {
            document.body.setAttribute('style', (document.body.getAttribute('style')||'').replace('overflow: visible !important;','') + 'overflow: visible !important;');
            document.body.classList.add( 'scroll_on' );
            debug( 'Scroll Unblocked from BODY tag');
        }
        if ( isOverflowHidden( htmlTag ) )
        {
            htmlTag.setAttribute('style', (htmlTag.getAttribute('style')||'').replace('overflow: visible !important;','') + 'overflow: visible !important;');
            htmlTag.classList.add( 'scroll_on' );
            debug( 'Scroll Unblocked from HTML tag ');
        }
    }

    window.addEventListener('DOMContentLoaded', (event) => {

        // Mutation Observer
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        // Create an observer instance
        var observer = new MutationObserver( (mutations) => {
            mutations.forEach( (mutation) => {
                if ( mutation.addedNodes.length ) {
                    Array.prototype.forEach.call( mutation.addedNodes, ( el ) => {
                        // skip unusual html tag names
                        if ( !tagNames_pattern.test ( el.tagName ) ) return;

                        // Check if element is an Anti-Adblock Modal Windows
                        if ( isModalWindows( el ) )
                        {
                            debug( 'OnMutationObserver: ', el );
                            removeModal( el );
                            unblockScroll();
                        }
                    });
                }
            });
        });
        // Observer
        observer.observe(document, {
            childList : true,
            subtree : true
        });

        // enable context menu again
        enableContextMenu();

        // First check with a little delay
        setTimeout( function() {
            checkModals();
        }, 100 );

        addStyle( '.hide_modal { -webkit-filter: blur(0px) !important; filter: blur(0px) !important; }' );
        addStyle( '.un_blur { -webkit-filter: blur(0px) !important; filter: blur(0px) !important; }' );
        addStyle( 'body.scroll_on, html.scroll_on { overflow: visible !important; }' );

    });

    window.addEventListener('load', (event) => {
        // Second check, when page is complete loaded ( just in case )
        checkModals();
    });

})();
