import { DocumentContainer } from '@node-projects/web-component-designer';
import { iobrokerHandler } from './IobrokerHandler.js';
export class CommandHandling {
    dockManager;
    iobrokerWebuiAppShell;
    constructor(dockManager, iobrokerWebuiAppShell, serviceContainer) {
        this.dockManager = dockManager;
        this.iobrokerWebuiAppShell = iobrokerWebuiAppShell;
        this.init(serviceContainer);
    }
    async handleCommandButtonClick(e) {
        let button = e.currentTarget;
        let commandName = button.dataset['command'];
        let commandParameter = button.dataset['commandParameter'];
        if (commandName === 'runtime') {
            let target = this.dockManager?.activeDocument?.elementContent?.assignedElements()[0];
            if (target?.title) {
                window.open("runtime.html?screenName=" + target.title);
            }
            else {
                window.open("runtime.html");
            }
        }
        else if (commandName === 'new') {
            let defaultName = '';
            if (!(await iobrokerHandler.getScreenNames()).includes('start'))
                defaultName = 'start';
            let screen = prompt("New Screen Name:", defaultName);
            let style = `* {
    box-sizing: border-box;
}`;
            if (screen) {
                if (commandParameter == 'grid') {
                    let columns = parseInt(prompt("No Columns:", "12"));
                    let rows = parseInt(prompt("No Rows:", "8"));
                    style += `\n\n:host {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: ${'1fr '.repeat(columns).trim()};
    grid-template-rows: ${'1fr '.repeat(rows).trim()};
    gap: 10px;
    padding: 10px;
}`;
                }
                this.iobrokerWebuiAppShell.newDocument(screen, null, style);
            }
        }
        else if (commandName === 'save') {
            let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
            //Todo: wrap screen in a screen editor wich handles save etc...
            if (target instanceof DocumentContainer) {
                let html = target.designerView.getHTML();
                let style = target.additionalData.model.getValue();
                let screen = { html, style, settings: {} };
                await iobrokerHandler.saveScreen(target.title, screen);
            }
            else {
                target.executeCommand({ type: commandName, parameter: commandParameter });
            }
        }
        else if (this.dockManager.activeDocument) {
            let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
            if (target.executeCommand) {
                target.executeCommand({ type: commandName, parameter: commandParameter });
            }
        }
    }
    handleInputValueChanged(e) {
        let input = e.currentTarget;
        let commandName = input.dataset['command'];
        let commandParameter = input.value;
        if (this.dockManager.activeDocument) {
            let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
            if (target.executeCommand) {
                target.executeCommand({ type: commandName, parameter: commandParameter });
            }
        }
    }
    init(serviceContainer) {
        let buttons = Array.from(document.querySelectorAll('[data-command]'));
        buttons.forEach(b => {
            if (b instanceof HTMLButtonElement) {
                b.onclick = (e) => this.handleCommandButtonClick(e);
            }
            else {
                b.onchange = (e) => this.handleInputValueChanged(e);
                let commandName = b.dataset['command'];
                if (commandName == 'setStrokeColor')
                    serviceContainer.globalContext.onStrokeColorChanged.on(e => b.value = e.newValue);
                if (commandName == 'setFillBrush')
                    serviceContainer.globalContext.onFillBrushChanged.on(e => b.value = e.newValue);
            }
        });
        setInterval(() => {
            if (this.dockManager.activeDocument) {
                let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
                if (target.canExecuteCommand) {
                    this.canExecuteCommand(buttons, target);
                }
                else {
                    this.canExecuteCommand(buttons, null);
                }
            }
            else {
                this.canExecuteCommand(buttons, null);
            }
        }, 100);
    }
    canExecuteCommand(buttons, target) {
        buttons.forEach(b => {
            let command = b.dataset['command'];
            let commandParameter = b.dataset['commandParameter'];
            if (command === 'new')
                b.disabled = false;
            else if (command === 'runtime')
                b.disabled = false;
            else
                b.disabled = !target ? true : !target.canExecuteCommand({ type: command, parameter: commandParameter });
        });
    }
}
