// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, OutputChannel} from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	let build = new Build();
	let controller = new Controller(build);
	let out = window.createOutputChannel("PdfTeX Output");
	let open = require("open");
	let viewer;
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	
	var disposable = commands.registerCommand('extension.buildPDF', () => {
		// The code you place here will be executed every time your command is executed
		let path = require('path');
		commands.executeCommand("workbench.action.files.save");
		let child = require("child_process");
		out.show(2);
		let doc = window.activeTextEditor.document;
		let pathToDir = path.dirname(doc.fileName);
		var pdflatex = child.spawnSync("pdflatex", 
		[doc.fileName, 
		'-interaction=nonstopmode',
		'-aux-directory=' + pathToDir,
		'-include-directory=' + pathToDir,
		'-output-directory=' + pathToDir]);
		let lines = pdflatex.stdout.toString();
		let parsedLines : string[] = lines.toString().split('\n');
		
		let errorCount: number = 0;
		parsedLines.forEach(function(line : string) {
			if(line[0] == '!') {
				if(errorCount < 3) {
					window.showErrorMessage(line);
				}
				errorCount ++;
			}
			console.log("pdftTeX> " + line);
			out.appendLine("pdfTex> " + line);
		});
		if (errorCount == 0) {
			window.showInformationMessage("No errors were recorded");
		}
		else if (errorCount == 1) {
			window.showErrorMessage("A total of " + errorCount + " error was recorded in the log file.");
		}
		else {
			window.showErrorMessage("A total of " + errorCount + " errors were recorded in the log file.");
		}
		let open = require("open");
		let pathToPdf: string = path.join(pathToDir , path.basename(doc.fileName, path.extname(doc.fileName)) + ".pdf");
		viewer = open(pathToPdf);
		// Display a message box to the user
	});
	
	context.subscriptions.push(disposable);
	context.subscriptions.push(controller);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class Build {
	private _toPDF: StatusBarItem;
	
	public buildToPDFButton() {
		if (!this._toPDF) { 
            this._toPDF = window.createStatusBarItem(StatusBarAlignment.Left); 
			this._toPDF.text = "$(beaker) Build to PDF";
			this._toPDF.command = "extension.buildPDF";
		}
		if (window.activeTextEditor.document.languageId != "latex") {
			this._toPDF.hide();
		}
		else {
			this._toPDF.show();
		}
	}
	
	public dispose() {
		this._toPDF.dispose();
	}
}

class Controller {

    private _build: Build;
    private _disposable: Disposable;

    constructor(build: Build) {
        this._build = build;
        this._build.buildToPDFButton();
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        this._build.buildToPDFButton();
        this._disposable = Disposable.from(...subscriptions);
	}

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._build.buildToPDFButton();
    }
}