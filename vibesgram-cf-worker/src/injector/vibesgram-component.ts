export const COMPONENT_HTML = `
<div class="vibesgram-wrapper">
  <div class="vibesgram-component">
    <img class="vibesgram-icon" src="\${props.assetsUrl}/icon.png" alt="Vibesgram">
    <div class="vibesgram-text-wrapper">
      <span class="vibesgram-hosted">hosted on</span>
      <span class="vibesgram-text">Vibes<span class="gram">gram</span></span>
    </div>
    <button class="vibesgram-close" aria-label="Close">
      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
        <path d="M7 6.3L12.3 1 13 1.7 7.7 7 13 12.3 12.3 13 7 7.7 1.7 13 1 12.3 6.3 7 1 1.7 1.7 1 7 6.3z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</div>
`;

export const COMPONENT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap');

.vibesgram-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
}

.vibesgram-component {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #fce7f3;
  border-radius: 20px;
  padding: 8px 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  user-select: none;
  animation: vibesgram-fade-in 0.3s ease-out;
}

.vibesgram-component:hover {
  transform: translateY(-2px);
}

.vibesgram-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.vibesgram-text-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0px;
}

.vibesgram-hosted {
  font-size: 9px;
  color: #666;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: 500;
  line-height: 1;
  margin-bottom: -1px;
}

.vibesgram-text {
  font-size: 16px;
  color: #000;
  font-style: italic;
  font-weight: 600;
  line-height: 1.2;
}

.vibesgram-text .gram {
  color: #b967ff;
  font-weight: inherit;
}

.vibesgram-close {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  padding: 0;
  transition: all 0.2s ease;
  opacity: 0;
}

.vibesgram-component:hover .vibesgram-close {
  opacity: 1;
}

.vibesgram-close:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #333;
}

@keyframes vibesgram-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

export const COMPONENT_JS = `
function initialize(root, props) {
  const wrapper = root.querySelector('.vibesgram-wrapper');
  const component = root.querySelector('.vibesgram-component');
  const closeButton = root.querySelector('.vibesgram-close');
  const icon = root.querySelector('.vibesgram-icon');

  // Set icon src
  if (icon && props.assetsUrl) {
    icon.src = props.assetsUrl + '/icon.png';
  }

  if (component && closeButton) {
    // Handle component click
    component.addEventListener('click', (e) => {
      if (!e.target.closest('.vibesgram-close')) {
        const baseUrl = 'https://' + props.appDomain;
        const path = props.type === 'preview' 
          ? \`/upload/preview/\${props.artifactId}\`
          : \`/a/\${props.artifactId}\`;
        window.open(baseUrl + path, '_blank');
      }
    });

    // Handle close button click
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      wrapper.style.display = 'none';
    });
  }
}
`;
