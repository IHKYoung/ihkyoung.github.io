import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, debounce } from 'obsidian';

interface Mark2HighlightPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: Mark2HighlightPluginSettings = {
    mySetting: 'default'
}

export default class Mark2HighlightPlugin extends Plugin {
    settings: Mark2HighlightPluginSettings;
    private onEditHandler: () => void;

    async onload() {
        await this.loadSettings();

        // 添加一个命令用于高亮替换
        this.addCommand({
            id: 'convert-highlight',
            name: 'Convert ==xxx== to <mark>xxx</mark>',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                // 获取编辑器内容
                const content = editor.getValue();
                // 使用正则替换 ==xxx== 为 <mark>xxx</mark>
                const updatedContent = content.replace(/==(.+?)==/g, '<mark>$1</mark>');
                // 更新编辑器内容
                editor.setValue(updatedContent);
                new Notice('All highlights converted!');
            }
        });

        // 自动监听编辑器变化并进行替换
        this.onEditHandler = debounce(() => {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                const editor = activeView.editor;
                const cursor = editor.getCursor();
                const line = editor.getLine(cursor.line);
                const regex = /==([^=]+)==/g;
                if (regex.test(line)) {
                    const updatedLine = line.replace(regex, '<mark>$1</mark>');
                    editor.setLine(cursor.line, updatedLine);
                    new Notice('Highlight converted automatically!');
                }
            }
        }, 500); // 延迟500ms执行，避免频繁触发

        this.registerEvent(this.app.workspace.on('editor-change', this.onEditHandler));

        // 添加设置选项（可选）
        this.addSettingTab(new Mark2HighlightSettingTab(this.app, this));
    }

    onunload() {
        console.log('Unloading Mark2HighlightPlugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class Mark2HighlightSettingTab extends PluginSettingTab {
    plugin: Mark2HighlightPlugin;

    constructor(app: App, plugin: Mark2HighlightPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Sample Setting')
            .setDesc('This is a sample setting.')
            .addText(text => text
                .setPlaceholder('Enter your setting value')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}