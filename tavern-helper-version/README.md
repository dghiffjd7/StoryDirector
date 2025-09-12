# Story Weaver - TavernHelper Version
## 故事大纲生成器 - TavernHelper版本

A complete migration of the Story Weaver extension to TavernHelper, providing full access to SillyTavern's lorebook system and enhanced functionality.

## 🌟 Key Advantages Over Extension Version

### ✅ **Full Lorebook Access**
- Direct access to all worldbook entries through TavernHelper APIs
- No security restrictions that limit third-party extensions
- Real-time worldbook data retrieval and formatting

### ✅ **Enhanced Integration**  
- Built-in variable system for persistent settings
- Custom slash commands for quick access
- Seamless chat integration
- Event-driven architecture

### ✅ **Better User Experience**
- Rich HTML interface with modern styling
- Real-time data preview capabilities
- Multiple export and sharing options
- Responsive design for different screen sizes

### ✅ **Easy Distribution**
- Single JavaScript file for easy sharing
- No need for users to modify core SillyTavern files
- Works with TavernHelper's repository system

## 🚀 Installation

### Prerequisites
1. **SillyTavern** - Latest version recommended
2. **TavernHelper (JS-Slash-Runner)** - Must be installed and running
3. Basic familiarity with SillyTavern's extension system

### Installation Steps

1. **Ensure TavernHelper is installed:**
   - TavernHelper should be available as a third-party extension in your SillyTavern
   - Check that `/jsr` commands work in your chat

2. **Install Story Weaver script:**
   ```javascript
   // Copy the contents of story-weaver-complete.js
   // Paste into TavernHelper's script manager
   // Or save as a new script in the repository
   ```

3. **Verify installation:**
   - Type `/sw` in your SillyTavern chat
   - The Story Weaver interface should open
   - Check console for initialization messages

## 📖 Usage

### Slash Commands

- **`/sw`** or **`/storyweaver`** - Opens the main Story Weaver interface
- **`/swquick [type] [chapters]`** - Quick story generation
  - Example: `/swquick fantasy 7` - Generate 7-chapter fantasy outline
  - Example: `/swquick romance` - Generate romance outline with default settings

### Main Interface

1. **Open Interface:** Use `/sw` command or click the TavernHelper interface
2. **Configure Context:** Set how many chat messages to include (0-500)
3. **Set Story Parameters:**
   - Story type (fantasy, romance, mystery, etc.)
   - Narrative style (descriptive, dialogue-driven, etc.) 
   - Theme and core conflicts
   - Chapter count and detail level
   - Special requirements
4. **Generate:** Click "生成故事大纲" to create your outline
5. **Export Results:** Copy, save, or send directly to chat

### Data Preview

Click "预览数据" to see what information will be used:
- Worldbook entries count and preview
- Character information status
- Chat history inclusion
- Current settings summary

## 🛠️ Technical Features

### Worldbook Integration
```javascript
// Automatic worldbook entry formatting
const entries = await TavernHelper.getWorldbook();
// Formats as: **Key**: Content for each entry
```

### Character Data Access
```javascript
// Retrieves current character information
const character = await TavernHelper.getCharacter();
// Includes: name, description, personality, scenario
```

### Chat History Processing
```javascript
// Configurable message count (0-500)
const history = await TavernHelper.getChatHistory(messageCount);
// Formats as: **Speaker**: Message content
```

### Settings Persistence
```javascript
// Automatic save/load using TavernHelper variables
await TavernHelper.setVariable('sw_storyType', 'fantasy');
const value = await TavernHelper.getVariable('sw_storyType');
```

## 🎨 Interface Features

### Modern UI Design
- Clean, professional interface inspired by OpenAI/Claude frontends
- Responsive design that works on desktop and mobile
- Intuitive form controls and clear visual hierarchy
- Real-time status updates and progress indicators

### Rich Functionality
- **Live Preview:** See your data before generation
- **Multiple Export Options:** Copy, save as file, or send to chat
- **Statistics Tracking:** Word count, generation time, chapter analysis
- **Error Handling:** Comprehensive error reporting with helpful messages
- **Notifications System:** Toast notifications for all actions

### Customization
- Persistent user preferences
- Configurable story types and styles
- Flexible prompt templating system
- Extensible architecture for future enhancements

## 🔧 Configuration

### Default Settings
```javascript
{
  contextLength: 100,        // Chat messages to include
  storyType: 'fantasy',      // Default story genre
  storyStyle: 'detailed',    // Narrative approach
  chapterCount: 5,           // Number of chapters
  detailLevel: 'detailed',   // Outline complexity
  includeSummary: true,      // Include story summary
  includeCharacters: true,   // Include character arcs
  includeThemes: false       // Include thematic analysis
}
```

### Story Types Available
- 🏰 Fantasy Adventure
- 💖 Romance
- 🔍 Mystery/Detective
- 🚀 Science Fiction
- 🌸 Slice of Life
- ⚔️ Action/Adventure
- 🎭 Drama
- 👻 Horror/Thriller
- 😄 Comedy
- 🎨 Custom

### Narrative Styles
- 📝 Detailed descriptive
- 💬 Dialogue-driven
- ⚡ Fast-paced action
- 🤔 Introspective/internal
- 📚 Episodic structure

## 🐛 Troubleshooting

### Common Issues

**Interface won't open:**
- Ensure TavernHelper is properly installed
- Check browser console for error messages
- Verify `/jsr` commands work in chat

**No worldbook data:**
- Confirm worldbook entries are enabled
- Check that character has associated world info
- Try the "刷新数据" (refresh data) button

**Generation fails:**
- Verify AI backend is connected and working
- Check that TavernHelper.generateRaw is available
- Review console logs for specific error messages

**Settings not saving:**
- Ensure TavernHelper variable system is working
- Check browser permissions for local storage
- Try restarting SillyTavern if issues persist

### Debug Mode
Enable console logging to see detailed execution information:
```javascript
// Check browser developer tools console for:
// [Story Weaver] messages for main functionality
// [Story Weaver UI] messages for interface actions
```

## 🔄 Migration from Extension Version

If you were using the original SillyTavern extension version:

1. **Backup Settings:** Export any custom presets/configurations
2. **Install TavernHelper Version:** Follow installation steps above  
3. **Test Functionality:** Verify worldbook access works correctly
4. **Remove Old Extension:** Disable/remove the original extension to avoid conflicts

### Key Differences
- **Better Data Access:** Full lorebook integration vs. limited extension access
- **Slash Commands:** New `/sw` and `/swquick` commands available
- **Enhanced UI:** More modern interface with better responsiveness
- **Persistent Storage:** Settings saved via TavernHelper variables
- **Direct Chat Integration:** Send results directly to chat conversation

## 📚 Development

### File Structure
```
tavern-helper-version/
├── story-weaver-complete.js    # Complete single-file version
├── story-weaver.js            # Main script (modular version)
├── interface.js               # UI builder functions
├── styles.js                  # CSS styles
├── interface-script.js        # Client-side JavaScript
└── README.md                  # This documentation
```

### Architecture
- **Main Script:** Core TavernHelper integration and API calls
- **Interface Builder:** HTML generation with embedded CSS/JS
- **Message System:** PostMessage communication between main script and interface
- **Variable System:** TavernHelper variables for persistent settings
- **Event Handling:** Comprehensive error handling and user feedback

## 🤝 Contributing

### Enhancement Ideas
- Multiple language support for interface
- Custom prompt template editor
- Batch generation for multiple scenarios
- Integration with other TavernHelper extensions
- Export to additional formats (PDF, EPUB, etc.)

### Code Style
- Follow existing JavaScript conventions
- Use clear, descriptive function names
- Include comprehensive error handling
- Add console logging for debugging
- Maintain backward compatibility

## 📄 License

This project inherits the same license as the original Story Weaver extension. Please respect all existing licensing terms.

---

**Story Weaver TavernHelper Version** - Unleashing the full potential of AI-powered story outline generation within SillyTavern! 🎭✨