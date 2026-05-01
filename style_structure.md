Modular CSS Architecture
Split the monolithic App.css into a co-located CSS system: global base styles, component-level CSS files next to components, and layout-specific styles.

New Structure
src/
├── styles/
│   ├── global.css          # CSS reset, base fonts, root vars only
│   ├── variables.css       # Design tokens (colors, spacing)
│   └── layout.css          # App shell, navbar positioning
├── components/
│   ├── Navbar/
│   │   ├── Navbar.jsx
│   │   └── Navbar.css      # Navbar styles only
│   ├── MessageCard/
│   │   ├── MessageCard.jsx
│   │   └── MessageCard.css # Message bubble styles
│   ├── MessageList/
│   │   ├── MessageList.jsx
│   │   └── MessageList.css # Scrollable container styles
│   ├── MessageForm/
│   │   ├── MessageForm.jsx
│   │   └── MessageForm.css # Input + button styles
│   ├── NamePrompt/
│   │   ├── NamePrompt.jsx
│   │   └── NamePrompt.css  # Modal overlay styles
│   ├── TypingIndicator/
│   │   ├── TypingIndicator.jsx
│   │   └── TypingIndicator.css
│   ├── OnlineBadge/
│   │   ├── OnlineBadge.jsx
│   │   └── OnlineBadge.css
│   └── Layout/
│       ├── Layout.jsx
│       └── Layout.css      # Layout wrapper styles
├── pages/
│   ├── Chat/
│   │   ├── Chat.jsx
│   │   └── Chat.css        # Chat page arrangement
│   ├── Home/
│   │   ├── Home.jsx
│   │   └── Home.css
│   └── Profile/
│       ├── Profile.jsx
│       └── Profile.css
└── App.css                 # Just imports global + variables
Implementation Steps
Create src/styles/variables.css
Design tokens: colors (--bg, --surface), spacing (--s-4, --s-8...), typography
Create src/styles/global.css
CSS reset (* margin/padding/box-sizing)
html/body/#root base styles
Import variables.css at top
Create src/styles/layout.css
.layout flex column structure
.layout-content fill behavior
Navbar sticky positioning
Create component folders with CSS
Move each component's styles to co-located .css file
Import CSS in component JSX
Remove those styles from App.css
Create page CSS files
Chat.css: chat-page layout, chat-header arrangement
Home.css: home-page centered layout
Profile.css: profile page styles
Update App.css
Just imports: @import './styles/variables.css'; @import './styles/global.css'; @import './styles/layout.css';
Rules Enforced
Global CSS: ONLY reset + base styles, NO component styles
Component CSS: Styles ONLY that component, NO other selectors
Layout CSS: ONLY structural (flex/grid), NO visual styling
Page CSS: ONLY page-specific arrangements
Co-location: Every component has its CSS in same folder
Cleanup
Delete old flat component files (move to folders)
Delete monolithic App.css styles after splitting
Ensure no duplicate styles across files
Acceptance Criteria
No component styles in global/layout files
Each component has co-located CSS
App.css only imports base styles
No style conflicts or duplication
Dark theme preserved
3-part layout (header/messages/input) works
Message bubbles (own/other) styled correctly*