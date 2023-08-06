import '@node-projects/web-component-designer';
import { TreeViewExtended, PropertyGrid } from '@node-projects/web-component-designer';
import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import "./widgets/IobrokerWebuiSolutionExplorer.js";
import "./runtime/ScreenViewer.js";
import "./widgets/IobrokerWebuiStyleEditor.js";
import "./controls/SvgImage.js";
import { IobrokerWebuiSolutionExplorer } from './widgets/IobrokerWebuiSolutionExplorer.js';
export declare class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
    activeElement: HTMLElement;
    mainPage: string;
    private _dock;
    private _dockManager;
    _solutionExplorer: IobrokerWebuiSolutionExplorer;
    _propertyGrid: PropertyGrid;
    _treeViewExtended: TreeViewExtended;
    private _styleChangedCb;
    private _styleEditor;
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    ready(): Promise<void>;
    private _setupServiceContainer;
    loadNpmPackages(): Promise<void>;
    private loadNpmPackage;
    newDocument(name: string, content: string, style: string): Promise<void>;
    globalStyleEditor(style: string): Promise<void>;
}
declare global {
    interface Window {
        appShell: IobrokerWebuiAppShell;
    }
}
