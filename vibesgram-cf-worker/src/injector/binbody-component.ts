export const COMPONENT_HTML = `
<div class="binbody-wrapper">
  <div class="binbody-component">
    <img class="binbody-icon" src="\${props.assetsUrl}/icon.png" alt="Binbody">
    <div class="binbody-text-wrapper">
      <span class="binbody-hosted">hosted on</span>
      <span class="binbody-text">Binbody</span>
    </div>
    <button class="binbody-close" aria-label="Close">
      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
        <path d="M7 6.3L12.3 1 13 1.7 7.7 7 13 12.3 12.3 13 7 7.7 1.7 13 1 12.3 6.3 7 1 1.7 1.7 1 7 6.3z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</div>
`;

export const COMPONENT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap');

.binbody-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
}

.binbody-component {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #e0f2f1;
  border-radius: 20px;
  padding: 8px 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  user-select: none;
  animation: binbody-fade-in 0.3s ease-out;
}

.binbody-component:hover {
  transform: translateY(-2px);
}

.binbody-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.binbody-text-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0px;
}

.binbody-hosted {
  font-size: 9px;
  color: #00796b;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: 500;
  line-height: 1;
  margin-bottom: -1px;
}

.binbody-text {
  font-size: 16px;
  color: #004d40;
  font-style: italic;
  font-weight: 600;
  line-height: 1.2;
}

.binbody-close {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 77, 64, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #00796b;
  padding: 0;
  transition: all 0.2s ease;
  opacity: 0;
}

.binbody-component:hover .binbody-close {
  opacity: 1;
}

.binbody-close:hover {
  background: rgba(0, 77, 64, 0.2);
  color: #004d40;
}

@keyframes binbody-fade-in {
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
  const wrapper = root.querySelector('.binbody-wrapper');
  const component = root.querySelector('.binbody-component');
  const closeButton = root.querySelector('.binbody-close');
  const icon = root.querySelector('.binbody-icon');

  // Set icon src
  if (icon && props.assetsUrl) {
    icon.src = props.assetsUrl + '/icon.png';
  }

  if (component && closeButton) {
    // Handle component click
    component.addEventListener('click', (e) => {
      if (!e.target.closest('.binbody-close')) {
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
