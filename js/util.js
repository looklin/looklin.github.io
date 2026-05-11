/* util.js — vanilla JS replacement (no jQuery) */

/* Panel system */
var panelInstances = [];

function panelInit(el, userConfig) {
    if (!el || !el.length) return;

    var config = Object.assign({
        delay: 0,
        hideOnClick: false,
        hideOnEscape: false,
        hideOnSwipe: false,
        resetScroll: false,
        resetForms: false,
        side: null,
        target: el,
        visibleClass: 'visible'
    }, userConfig || {});

    if (typeof config.target === 'string') {
        config.target = document.querySelector(config.target);
    }

    // Hide method
    el._hide = function (event) {
        if (!config.target || !config.target.classList.contains(config.visibleClass)) return;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        config.target.classList.remove(config.visibleClass);
        window.setTimeout(function () {
            if (config.resetScroll) el.scrollTop = 0;
            if (config.resetForms) {
                el.querySelectorAll('form').forEach(function (f) { f.reset(); });
            }
        }, config.delay);
    };

    // Vendor fixes
    el.style.msOverflowStyle = '-ms-autohiding-scrollbar';
    el.style.webkitOverflowScrolling = 'touch';

    // Hide on click (child links)
    if (config.hideOnClick) {
        el.querySelectorAll('a').forEach(function (a) {
            a.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
        });

        el.addEventListener('click', function (e) {
            var link = e.target.closest('a');
            if (!link) return;
            var href = link.getAttribute('href');
            var target = link.getAttribute('target');
            if (!href || href === '#' || href === '#' + el.id) return;
            e.preventDefault();
            e.stopPropagation();
            el._hide();
            window.setTimeout(function () {
                if (target === '_blank') window.open(href);
                else window.location.href = href;
            }, config.delay + 10);
        });
    }

    // Touch events (swipe)
    el.addEventListener('touchstart', function (e) {
        el.touchPosX = e.touches[0].pageX;
        el.touchPosY = e.touches[0].pageY;
    });

    el.addEventListener('touchmove', function (e) {
        if (el.touchPosX === null || el.touchPosY === null) return;
        var diffX = el.touchPosX - e.touches[0].pageX;
        var diffY = el.touchPosY - e.touches[0].pageY;
        var th = el.offsetHeight;
        var ts = el.scrollHeight - el.scrollTop;

        if (config.hideOnSwipe) {
            var result = false, boundary = 20, delta = 50;
            switch (config.side) {
                case 'left': result = (diffY < boundary && diffY > -boundary) && (diffX > delta); break;
                case 'right': result = (diffY < boundary && diffY > -boundary) && (diffX < -delta); break;
                case 'top': result = (diffX < boundary && diffX > -boundary) && (diffY > delta); break;
                case 'bottom': result = (diffX < boundary && diffX > -boundary) && (diffY < -delta); break;
            }
            if (result) {
                el.touchPosX = null;
                el.touchPosY = null;
                el._hide();
                return false;
            }
        }

        if ((el.scrollTop < 0 && diffY < 0) || (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // Prevent bubbling
    el.addEventListener('click', function (e) { e.stopPropagation(); });
    el.addEventListener('touchend', function (e) { e.stopPropagation(); });
    el.addEventListener('touchstart', function (e) { e.stopPropagation(); });
    el.addEventListener('touchmove', function (e) { /* already registered above */ });

    // Click on child anchor pointing to self
    el.addEventListener('click', function (e) {
        var link = e.target.closest('a[href="#' + el.id + '"]');
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        config.target.classList.remove(config.visibleClass);
    });

    // Body: hide panel on tap
    document.body.addEventListener('click', function () { el._hide(); });
    document.body.addEventListener('touchend', function () { el._hide(); });

    // Body: toggle on anchor
    document.body.addEventListener('click', function (e) {
        var link = e.target.closest('a[href="#' + el.id + '"]');
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        config.target.classList.toggle(config.visibleClass);
    });

    // ESC key
    if (config.hideOnEscape) {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') el._hide(e);
        });
    }
}

/* Placeholder polyfill (modern browsers support it natively) */
function placeholderInit() {
    // All modern browsers support placeholder natively — skip polyfill
    return;
}

/* Prioritize elements */
function prioritize(selector, condition) {
    var elements = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
    elements.forEach(function (el) {
        var parent = el.parentElement;
        if (!parent) return;

        if (condition) {
            if (!el.__prioritized) {
                var prev = el.previousElementSibling;
                if (prev) {
                    parent.insertBefore(el, parent.firstChild);
                    el.__prioritized = prev;
                }
            }
        } else {
            if (el.__prioritized) {
                var ref = el.__prioritized;
                parent.insertBefore(el, ref.nextSibling);
                el.__prioritized = null;
            }
        }
    });
}
