/**
 * This iconset is using an external svg image.
 *
 */

import '@proddi/x-icons/x-iconset-svg.js';
import '@proddi/x-icons/x-icon.js';

const iconsetUrl = import.meta.url.replace(/\.js$/, '.svg');

const template = document.createElement('template');
template.innerHTML = `<x-iconset-svg name="maneuver" href="${iconsetUrl}" viewBox="0 0 43 43"
    icons="depart arrive">
</x-iconset-svg>`;

const node = document.importNode(template.content, true);
const maneuverIcons = node.querySelector('x-iconset-svg');

export { maneuverIcons }
