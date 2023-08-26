import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { CodeViewMonaco, ContextMenu, DesignItem, PropertiesHelper } from "@node-projects/web-component-designer";
import { IobrokerWebuiScriptEditor } from "./IobrokerWebuiScriptEditor.js";
export class IobrokerWebuiEventAssignment extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    ready() {
        this._bindingsParse();
    }
    set instanceServiceContainer(value) {
        this._instanceServiceContainer = value;
        this._selectionChangedHandler?.dispose();
        this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
            this.selectedItems = e.selectedElements;
        });
        this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
    }
    _getEventColor(eventItem) {
        switch (this._getEventType(eventItem)) {
            case 'js':
                return 'purple';
            case 'script':
                return 'lightgreen';
        }
        return 'white';
    }
    _getEventType(eventItem) {
        if (this.selectedItems && this.selectedItems.length) {
            if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
                if (this.selectedItems[0].getAttribute('@' + eventItem.name).startsWith('{'))
                    return 'script';
                else
                    return 'js';
            }
        }
        return 'none';
    }
    _getEventMethodname(eventItem) {
        return this.selectedItems[0].getAttribute('@' + eventItem.name);
    }
    _inputMthName(event, eventItem) {
        let el = event.target;
        this.selectedItems[0].setAttribute('@' + eventItem.name, el.value);
    }
    _ctxMenu(e, eventItem) {
        e.preventDefault();
        ContextMenu.show([{ title: 'remove', action: () => { this.selectedItems[0].removeAttribute('@' + eventItem.name); this._bindingsRefresh(); } }], e);
    }
    async _addEvent(e) {
        if (e.key == 'Enter') {
            let ip = this._getDomElement('addEventInput');
            this._selectedItems[0].setAttribute('@' + PropertiesHelper.camelToDashCase(ip.value.replaceAll(' ', '-')), '');
            ip.value = '';
            this.scrollTop = 0;
            this.refresh();
        }
    }
    async _contextMenuAddEvent(event, eventItem) {
        ContextMenu.show([{
                title: 'Add JS Handler',
                action: () => {
                    let nm = prompt('name of function ?');
                    if (nm) {
                        this._selectedItems[0].setAttribute('@' + eventItem.name, nm);
                        this.refresh();
                        this._editEvent(null, eventItem);
                    }
                }
            }], event);
    }
    async _editEvent(e, eventItem) {
        if (this._getEventType(eventItem) == 'js') {
            let scriptTag = this.selectedItems[0].instanceServiceContainer.designerCanvas.shadowRoot.querySelector('script[type=module]');
            if (!scriptTag) {
                let jsName = this.selectedItems[0].getAttribute('@' + eventItem.name);
                let templateScript = `
export function ${jsName}(event, element, shadowRoot) {

}
`;
                scriptTag = document.createElement('script');
                scriptTag.setAttribute('type', 'module');
                scriptTag.textContent = templateScript;
                let di = DesignItem.createDesignItemFromInstance(scriptTag, this.selectedItems[0].serviceContainer, this.selectedItems[0].instanceServiceContainer);
                di.instanceServiceContainer.designerCanvas.rootDesignItem.insertChild(di, 0);
            }
            let scriptDesignItem = DesignItem.GetDesignItem(scriptTag);
            let cvm = new CodeViewMonaco();
            cvm.language = 'javascript';
            cvm.code = scriptDesignItem.content;
            cvm.style.position = 'relative';
            let res = await window.appShell.openConfirmation(cvm, 200, 200, 600, 400, this);
            if (res) {
                scriptDesignItem.content = cvm.getText();
            }
        }
        else {
            let scriptString = this.selectedItems[0].getAttribute('@' + eventItem.name);
            if (!scriptString || scriptString.startsWith('{')) {
                let script = { commands: [] };
                if (scriptString)
                    script = JSON.parse(scriptString);
                let sc = new IobrokerWebuiScriptEditor();
                sc.loadScript(script);
                sc.title = "Script '" + eventItem.name + "' on " + this.selectedItems[0].name;
                let res = await window.appShell.openConfirmation(sc, 100, 100, 600, 500);
                if (res) {
                    let scriptCommands = sc.getScriptCommands();
                    if (scriptCommands && scriptCommands.length) {
                        let json = JSON.stringify({ commands: scriptCommands });
                        this.selectedItems[0].setAttribute('@' + eventItem.name, json);
                        this._bindingsRefresh();
                    }
                }
            }
        }
    }
    refresh() {
        if (this._selectedItems != null && this._selectedItems.length) {
            this.events = this._selectedItems[0].serviceContainer.getLastServiceWhere('eventsService', x => x.isHandledElement(this._selectedItems[0])).getPossibleEvents(this._selectedItems[0]);
        }
        else {
            this.events = [];
        }
        this._bindingsRefresh();
    }
    get selectedItems() {
        return this._selectedItems;
    }
    set selectedItems(items) {
        if (this._selectedItems != items) {
            this._selectedItems = items;
            this.refresh();
        }
    }
}
IobrokerWebuiEventAssignment.style = css `
    :host {
        display: grid;
        grid-template-columns: 20px 1fr auto 30px;
        overflow-y: auto;
        align-content: start;
        height: 100%;
    }
    .rect {
        width: 7px;
        height: 7px;
        border: 1px solid black;
        justify-self: center;
    }
    input.mth {
        width: 100%;
        box-sizing: border-box;
    }
    div {
        width: 40px;
        align-self: center;
        white-space: nowrap;
    }`;
IobrokerWebuiEventAssignment.template = html `
        <template repeat:item="[[this.events]]">
            <div @contextmenu="[[this._ctxMenu(event, item)]]" class="rect" css:background-color="[[this._getEventColor(item)]]"></div>
            <div css:grid-column-end="[[this._getEventType(item) == 'js' ? 'span 1' : 'span 2']]" title="[[item.name]]">[[item.name]]</div>
            <input @input="[[this._inputMthName(event, item)]]" class="mth" value="[[this._getEventMethodname(item)]]" css:display="[[this._getEventType(item) == 'js' ? 'block' : 'none']]" type="text">
            <button @contextmenu="[[this._contextMenuAddEvent(event, item)]]" @click="[[this._editEvent(event, item)]]">...</button>
        </template>
        <span style="grid-column: 1 / span 3; margin-top: 8px; margin-left: 3px;">add event:</span>
        <input id="addEventInput" style="grid-column: 1 / span 3; margin: 5px;" @keypress=[[this._addEvent(event)]] type="text">`;
customElements.define("iobroker-webui-event-assignment", IobrokerWebuiEventAssignment);
