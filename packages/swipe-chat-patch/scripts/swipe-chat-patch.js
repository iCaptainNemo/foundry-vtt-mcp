/**
 * SwipeVTT Chat Patch
 *
 * - Adds a fixed chat input bar to the SwipeVTT mobile chat drawer
 * - Makes the drawer full-screen and shows all messages in a scrollable list
 */

const MODULE_ID = 'swipe-chat-patch';

// ─── Chat Input Bar ──────────────────────────────────────────────────────────

function createInputBar() {
  if (document.getElementById('swipe-chat-input-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'swipe-chat-input-bar';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Send a message...';
  textarea.rows = 1;
  textarea.id = 'swipe-chat-text';

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage(textarea);
    }
  });

  const sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
  sendBtn.title = 'Send';
  sendBtn.addEventListener('click', () => submitMessage(textarea));

  bar.appendChild(textarea);
  bar.appendChild(sendBtn);
  document.body.appendChild(bar);
}

async function submitMessage(textarea) {
  const message = textarea.value.trim();
  if (!message) return;

  try {
    await ChatMessage.create({
      content: message,
      speaker: ChatMessage.getSpeaker(),
    });
    textarea.value = '';
    textarea.style.height = 'auto';
    scrollChatToBottom();
  } catch (err) {
    console.error(`[${MODULE_ID}] Failed to send message:`, err);
    ui.notifications?.error('Failed to send message.');
  }
}

function scrollChatToBottom() {
  // The scrollable area is the .chat-popout-wrapper after our CSS override
  const wrapper = document.querySelector('.mobile-chat-drawer .chat-popout-wrapper');
  if (wrapper) {
    wrapper.scrollTop = wrapper.scrollHeight;
  }
}

// ─── Card-Swipe Neutralizer ───────────────────────────────────────────────────
//
// SwipeVTT's premium code adds mobile-sliding / mobile-peek classes and inline
// transforms to individual chat messages for its card-navigation gesture. Since
// we now show all messages in a scrollable list, we kill that effect by watching
// for those class/style mutations and immediately reverting them.

let cardSwipeObserver = null;

function neutralizeCardSwipe(wrapper) {
  if (cardSwipeObserver) {
    cardSwipeObserver.disconnect();
  }

  cardSwipeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const el = m.target;
      if (!(el instanceof HTMLElement)) continue;

      if (m.type === 'attributes' && m.attributeName === 'class') {
        // Strip the card-navigation classes SwipeVTT adds
        if (el.classList.contains('mobile-sliding') || el.classList.contains('mobile-peek')) {
          el.classList.remove('mobile-sliding', 'mobile-peek');
        }
      }

      if (m.type === 'attributes' && m.attributeName === 'style') {
        // Strip any inline transform SwipeVTT applies for the slide animation
        if (el.style.transform && el.style.transform !== 'none') {
          el.style.transform = '';
          el.style.transition = '';
          el.style.opacity = '';
        }
      }
    }
  });

  // Observe all current and future chat messages in the drawer
  function observeMessages() {
    wrapper.querySelectorAll('.chat-message').forEach((msg) => {
      cardSwipeObserver.observe(msg, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    });
  }

  // Also watch for new messages being added to the log
  const logObserver = new MutationObserver(() => observeMessages());
  const log = wrapper.querySelector('.chat-log');
  if (log) logObserver.observe(log, { childList: true });

  observeMessages();
}

// ─── Body Class Observer ─────────────────────────────────────────────────────

function watchBodyClass() {
  createInputBar();

  const observer = new MutationObserver(() => {
    const isOpen = document.body.classList.contains('mobile-chat-open');
    if (isOpen) {
      // Short delay so the drawer animation finishes before we scroll
      setTimeout(() => {
        scrollChatToBottom();
        document.getElementById('swipe-chat-text')?.focus();

        // Neutralize card-swipe on the now-visible wrapper
        const wrapper = document.querySelector('.mobile-chat-drawer .chat-popout-wrapper');
        if (wrapper) neutralizeCardSwipe(wrapper);
      }, 350);
    }
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Also scroll to bottom whenever a new chat message is created
  Hooks.on('createChatMessage', () => {
    if (document.body.classList.contains('mobile-chat-open')) {
      setTimeout(scrollChatToBottom, 100);
    }
  });
}

// ─── Foundry Hooks ───────────────────────────────────────────────────────────

Hooks.once('ready', () => {
  console.log(`[${MODULE_ID}] Initializing`);
  watchBodyClass();
});
