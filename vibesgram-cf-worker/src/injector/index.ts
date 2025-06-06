import { COMPONENT_HTML, COMPONENT_JS, COMPONENT_STYLE } from './binbody-component';

export interface InjectionConfig {
	position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
	margin?: number;
	artifactId?: string;
	assetsUrl?: string;
	appDomain?: string;
	type: 'preview' | 'published';
}

/**
 * Generate CSS positioning styles based on the provided configuration
 */
function getPositionStyles(config: InjectionConfig = { type: 'published' }): string {
	const { position = 'bottom-right', margin = 20 } = config;
	const styles = [];

	styles.push('position: fixed');
	styles.push('z-index: 9999');

	if (position.includes('right')) {
		styles.push(`right: ${margin}px`);
	} else {
		styles.push(`left: ${margin}px`);
	}

	if (position.includes('bottom')) {
		styles.push(`bottom: ${margin}px`);
	} else {
		styles.push(`top: ${margin}px`);
	}

	return styles.join(';');
}

/**
 * Inject the Binbody component into HTML content
 */
export function injectBinbodyComponent(html: string, config: InjectionConfig = { type: 'published' }): string {
	// Only inject if the HTML content contains a body tag
	if (!html.includes('</body>')) {
		return html;
	}

	const container = `
<div id="binbody-container" style="${getPositionStyles(config)}"></div>
<script>
  (function() {
    // Define component functions
    ${COMPONENT_JS}

    // Create container and shadow root
    const container = document.getElementById('binbody-container');
    const shadow = container.attachShadow({ mode: 'open' });
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(COMPONENT_STYLE)};
    shadow.appendChild(style);
    
    // Add HTML content
    const wrapper = document.createElement('div');
    wrapper.innerHTML = ${JSON.stringify(COMPONENT_HTML)};
    shadow.appendChild(wrapper);

    // Initialize component
    initialize(shadow, {
      artifactId: ${config.artifactId ? `"${config.artifactId}"` : 'null'},
      assetsUrl: ${config.assetsUrl ? `"${config.assetsUrl}"` : '"https://assets.binbody.com"'},
      appDomain: ${config.appDomain ? `"${config.appDomain}"` : '"binbody.com"'},
      type: "${config.type}"
    });
  })();
</script>`;

	return html.replace('</body>', `${container}</body>`);
}
