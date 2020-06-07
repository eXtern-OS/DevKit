//snw.Window.get().evalNWBin(null, '/usr/eXtern/iXAdjust/apps/extern.devkit.app/editor.bin');

var edited = false;
var savedChanges;
var clipboard = nw.Clipboard.get(); // get the system clipboard
var lastEditorID = -1;
var currentEditorID = 0;
var availableTabs = [];
var projectNo = 1;
/*Loading up important modules*/
var gui = require("nw.gui");
var win = gui.Window.get();
var chokidar = require('chokidar');
var fs = require('fs-extra');
var ncp = require('ncp').ncp;
var path = require('path');
const execSync = require('child_process').execSync;
var editor;
var choosingNewProjectLocation = false; //To save resource/re-use code, will use the same directory chosing code but check what we want to do with the output. In this case if true then it's for a new project, false, opening an existing project
var selectedDirectoryForNewProject = process.env['HOME']+"/Projects";
var editors = [];
var fontSize = 14; //Default font
var selectedProjectType = 'eXternOSApp'; //What type of project to create when user creates a new project
var allDirectories = [];
var selectedDirectoryForNewDirectory;
var selectedDirectoryForBuilding;
var filesToBuild = [];
var currentFileBeingProcessedToBinaryIndex = 0;
var buildToPackageAfterBinaryCompilation = false;

$("#selectedDirectoryForNewProject").text(selectedDirectoryForNewProject);

//console.log("process",process.env);

//win.showDevTools();



function resizeEditor() {
  if (editors.length > 0)
    editor.layout(); 
}

function executeApp(appLocation) {
	win.RunAppDev(appLocation);
	win.minimize();
}

function setFontSize(newFontSize) {
 //(function(){
                    //Basic
                    $('.spinner-1').spinedit('setValue', newFontSize);
                    
                    $('.spinner-1').on("valueChanged", function (e) {
                        //console.log(e.value);
                        $("#fontIndicator").text(e.value);
                        //$("#textEditingArea").css("fontSize", e.value);
			editor.updateOptions({ fontSize: e.value});
                    });
                    
                //})();
}

//win.showDevTools();

function newExternOSApp(projectDirectory) {
	console.log("copying project files...");
	if (!fs.existsSync(projectDirectory)) {
		console.log("creating directory...");
		fs.mkdirSync(projectDirectory);
	}
	closePopupDialogue(true);
	    ncp('/usr/eXtern/systemX/Shared/CoreAPP/extern.template.app', projectDirectory+"/", function (err) {
  		if (err) {
    			console.error(err);
  		} else {
   			 console.log("success!");
			var pjson = JSON.parse(fs.readFileSync(projectDirectory+'/package.json', 'utf8'));

			console.log('$("#newProjectName").val()',$("#newProjectName").val());
			pjson.name = $("#newProjectName").val();
			pjson.author = $("#teamDeveloperProjectName").val();
			pjson.id = "extern."+$("#newProjectName").val()+"."+pjson.author+".app";
			//console.log('$("#newProjectName").val()',$("#newProjectName"));
			//console.log("pjson",pjson);
			$("#newProjectName").val("");
			$("#teamDeveloperProjectName").val("");
			fs.writeFile(projectDirectory+'/package.json', JSON.stringify(pjson,null,4), function (err) {
    				if (err) {
      					console.log("Write failed: ", err);
      					return;
    				} else {
					openProject(projectDirectory);
				}
			});
            		
		}
            });
}

function addNewDirectoryTo(direcoryIndex) {
 	console.log("allDirectories",allDirectories);
	$("#newItemWindow").removeClass("hidden");
	$("#newItemName").focus();
	selectedDirectoryForNewDirectory = allDirectories[direcoryIndex];
	selectedDirectoryForNewDirectory.index = direcoryIndex;
	//setTimeout(function(){ $("#newItemName").focus(); }, 1000);
	
}

function createNewDirectory() {
	if (!fs.existsSync(selectedDirectoryForNewDirectory.location+"/"+$("#newItemName").val())) {
		console.log("creating directory...");
		fs.mkdirSync(selectedDirectoryForNewDirectory.location+"/"+$("#newItemName").val());
		closePopupDialogue();
		$(selectedDirectoryForNewDirectory.element).parent().find("ul").empty();
		openDIrectory(selectedDirectoryForNewDirectory.index,selectedDirectoryForNewDirectory.element);
	}
}

function createNewProject() {
	console.log("creating project...");
	if (selectedProjectType == "eXternOSApp")
		newExternOSApp(selectedDirectoryForNewProject+"/"+$("#newProjectName").val());
}

function selectProjectType(projectType,pureName) {
	if ((projectType == "eXternOSApp") || (projectType == "emptyProject")) { //Project from malicious/incorrect input
		selectedProjectType = projectType;
		$("#selectedNewProjectType").text(pureName);
	}
}

function handleOpenButton() {
  $("#openDirectory").trigger("click");
}


function openProject(directory) {
  
  $("#no-file-open").addClass("hidden");
  $("#main").removeClass("hidden");

$("#accordionContainer").prepend('<div class="panel-group block hidden" id="accordion'+projectNo+'">'+
                            '<div class="panel panel-default">'+
                                '<div class="panel-heading">'+
                                    '<h3 class="panel-title">'+
                                        '<a id="projectName'+projectNo+'" class="accordion-toggle collapsed active" data-toggle="collapse" data-parent="#accordion'+projectNo+'" href="#collapseProject'+projectNo+'">'+
                                            'Unnamed'+
                                        '</a>'+
                                    '</h3>'+
                                '</div>'+
                                '<div id="collapseProject'+projectNo+'" class="panel-collapse collapse in">'+
                                    '<div id="projectFiles'+projectNo+'" class="panel-body">'+
				   '</div></div></div></div>');

//Settings panel

$("#accordionContainerSettings").prepend('<div class="panel-group block hidden" id="accordionSettings'+projectNo+'">'+
                            '<div class="panel panel-default">'+
                                '<div class="panel-heading">'+
                                    '<h3 class="panel-title">'+
                                        '<a id="projectNameSettings'+projectNo+'" class="accordion-toggle collapsed active" data-toggle="collapse" data-parent="#accordionSettings'+projectNo+'" href="#collapseProjectSettings'+projectNo+'">'+
                                            'Unnamed'+
                                        '</a>'+
                                    '</h3>'+
                                '</div>'+
                                '<div id="collapseProjectSettings'+projectNo+'" class="panel-collapse collapse in">'+
                                    '<div id="projectSettings'+projectNo+'" class="panel-body">'+
				'<h4 class="block-title">Compiling eXtern OS Apps</h4>'+
				'<div id="projectCompilingWarning" class="alert alert-info" style="text-align: left;">'+
                        		        'Please note, compiling to binary might require the project to be recompiled for every major release of eXtern OS.'+
                                    '</div>'+

                                    '<div class="radio">'+

                                        
                        '<label>'+
                            '<input type="radio" projectNo="'+projectNo+'" name="radio" value="buildNoCompileJS" buildType="direct-build">'+
                            'Build Package without compiling JS files'+
                        '</label>'+

                        '</div>'+

                        '<div class="radio">'+
                    
                        '<label>'+
                            '<input type="radio" projectNo="'+projectNo+'" name="radio" value="buildCompileJS" buildType="compile-build">'+
                            'Compile JS files to binary & build package'+
                        '</label>'+
                    '</div>'+
                                        
                    '<div class="radio">'+
                        '<label>'+
                            '<input type="radio" projectNo="'+projectNo+'" name="radio" value="CompileJSNoBuild" buildType="compile-only">'+
                            'Compile JS files without buidling package'+
                        '</label>'+
                    '</div>'+
		//'<h4 class="block-title">Version and Developer Settings</h4>'+ //FIXME Add these later

				   '</div></div></div></div>');

	//Checkbox + Radio skin
	$('input:checkbox:not([data-toggle="buttons"] input, .make-switch input), input:radio:not([data-toggle="buttons"] input)').iCheck({
		    checkboxClass: 'icheckbox_minimal',
		    radioClass: 'iradio_minimal',
		    increaseArea: '20%' // optional
	});

$('input[name="radio"]').on('ifClicked', function(event){

	console.log("input changed",this.value);
	console.log("input changed for project: ",$(this).attr("projectNo"));

	var projNo = $(this).attr("projectNo");

	for (var i = 0; i < allDirectories.length; i++) {
		if (allDirectories[i].id == projNo) {
			console.log("found");
			jsApp = JSON.parse(fs.readFileSync(allDirectories[i].location+"/package.json", 'utf8'));
			jsApp.settings["build-type"] = $(this).attr("buildType");

			fs.writeFile(allDirectories[i].location+'/package.json', JSON.stringify(jsApp,null,4), function (err) {
    				if (err) {
      					console.log("Write failed: ", err);
      					return;
    				} else {
					console.log("saved settings");
				}
			});

			//console.log("found jsApp fixed: ",jsApp);
			
		}
	}

});

	var dirID = allDirectories.length; //Before we add more stuff into this array

	var projectFilesDiv = $("#projectFiles"+projectNo)[0];
	console.log("projectFilesDiv",projectFilesDiv);
	var dirObj = {
		id: projectNo,
		element: projectFilesDiv,
		location: directory
	}

allDirectories.push(dirObj);
    allFilesUrls = [];
    allFiles = document.createElement("UL");
    $(allFiles).attr("id","projectOuter"+projectNo);
    $(allFiles).empty();
    filetree = {};
    console.log("directory",directory);
	allFiles.isExternApp = false;
    walkDirectory(directory, filetree, allFiles);
//executeApp (projectDir)
	console.log("filetree",filetree);


$("#projectName"+projectNo).text(directory.substring(directory.lastIndexOf('/')+1));
$("#projectNameSettings"+projectNo).text(directory.substring(directory.lastIndexOf('/')+1)+" (Settings)");
$(allFiles).addClass("collapsibleList");
if (allFiles.isExternApp) {
	var runDisabled = "";
	var buildDisabled = "";
console.log("gets hereK");
	if (directory.indexOf("/usr/eXtern/systemX/apps/") == 0)
	runDisabled = 'title="App already installed" disabled';
console.log("gets hereA: ");
try {
jsApp = JSON.parse(fs.readFileSync(directory+"/package.json", 'utf8'));
} catch(e) {
console.log("error",e);
}
var canBuildApp = false;

console.log("gets hereB");

if (jsApp.settings != undefined) {
	if (jsApp.settings["build-type"] != undefined) {
		if (jsApp.settings["build-type"] == "direct-build") { //Build Package without compiling JS files
			$('input[value="buildNoCompileJS"]').iCheck('check');
			canBuildApp = true;
		}

		if (jsApp.settings["build-type"] == "compile-build") { //Compile JS files to binary & build package
			$('input[value="buildCompileJS"]').iCheck('check');
			canBuildApp = true;
		}

		if (jsApp.settings["build-type"] == "compile-only") { //Compile JS files without buidling package
			$('input[value="CompileJSNoBuild"]').iCheck('check');
			canBuildApp = true;
		}
	}
}

console.log("gets hereC");

	if (!canBuildApp)
		buildDisabled = 'title="Build App settings are missing or are incorrectly defined in package.json" disabled';

$("#projectFiles"+projectNo).prepend('<p style="text-align: center;"><a href="#" onclick="executeApp (&quot'+directory+'&quot)" class="btn btn-alt m-r-5" '+runDisabled+'><span class="icon" >&#61881;</span> Run</a> <a href="#" onclick="openBuildDialogue(&quot'+directory+'&quot)" class="btn btn-alt m-r-5" '+buildDisabled+'><span class="icon">&#61897;</span> Build</a></p>');
}
$("#projectFiles"+projectNo).append(allFiles);
$("#projectFiles"+projectNo).append('<a href="#" onclick="addNewDirectoryTo('+dirID+')" class="btn btn-alt m-r-5" style="width: 100%; border: none !important;"><span class="icon">&#61943;</span> New Folder</a>');


//imgToSvg();
//CollapsibleLists.apply();
CollapsibleLists.applyTo(allFiles);

console.log("gets herex");

var watcher = chokidar.watch(dirObj.location, {ignored: /^\./, persistent: true,ignoreInitial:true});

watcher
  .on('add', function(path) {
	console.log('File', path, 'has been added');


	var filePath = path.substring(0, path.lastIndexOf("/"));
	for (var i = 0; i < allDirectories.length; i++) {

		if (allDirectories[i].id != undefined) {
			if (filePath.indexOf(allDirectories[i].location) == 0) {
				console.log("found folder modified: ",allDirectories[i]);
				$(allDirectories[i].element).parent().find("ul").empty();
				openDIrectory(i,allDirectories[i].element);
			}
		}
		
	}

	/*$(selectedDirectoryForNewDirectory.element).parent().find("ul").empty();
		openDIrectory(selectedDirectoryForNewDirectory.index,selectedDirectoryForNewDirectory.element);*/


	})

  .on('unlink', function(path) {
	console.log('File', path, 'has been removed');


	var filePath = path.substring(0, path.lastIndexOf("/"));
	for (var i = 0; i < allDirectories.length; i++) {

		if (allDirectories[i].id != undefined) {
			if (filePath.indexOf(allDirectories[i].location) == 0) {
				console.log("found folder modified: ",allDirectories[i]);
				$(allDirectories[i].element).parent().find("ul").empty();
				openDIrectory(i,allDirectories[i].element);
			}
		}
		
	}

	/*$(selectedDirectoryForNewDirectory.element).parent().find("ul").empty();
		openDIrectory(selectedDirectoryForNewDirectory.index,selectedDirectoryForNewDirectory.element);*/


	});



//console.log("allDirectories :",allDirectories);


//http://code.iamkate.com/javascript/collapsible-lists/
$("#accordion"+projectNo).removeClass("hidden");
$("#accordionSettings"+projectNo).removeClass("hidden");
$("#files").removeClass("verticalCenter");
projectNo++;

console.log("#files",document.getElementById('files'));

console.log("allDirectories",allDirectories);
}

var dirs = '/usr/eXtern/systemX/apps/extern.welcome.app';

var filetree = {};

var allFiles = document.createElement("UL");
var allFilesUrls = [] //Will be used to store full urls incase html reformats and loses the correct name

function openFile(fileID,icon, fileDiv) {

   onChosenFileToOpen(allFilesUrls[fileID],fileDiv);
   $(".projectFile").removeClass("fileActive");
   $(fileDiv).addClass("fileActive");
   //$("#tabicon"+currentEditorID).attr("src",icon);
   //var overflowRegular2, overflowInvisible = false;
   //overflowRegular2 = $('.CodeMirror-scroll').niceScroll({mousescrollstep: 80, smoothscroll: true, zindex:2999999999, bouncescroll: true, enabletranslate3d:true});

   //overflowRegular2 = $('.CodeMirror-scroll').niceScroll();
   //console.log("selected DIV",fileDiv);

}

function canWrite(path, callback) {
  fs.access(path, fs.W_OK, function(err) {
    callback(null, !err);
  });
}

function newEmptyEditor() {
	$("#projectFiles0 > ul").prepend("<li><span class='fileIcon'><img class='svgIcon' src='../extern.files.app/icons/blank.png'></span><a href='#' icon='../extern.files.app/icons/blank.png' class='projectFile' onclick='openFile("+allFilesUrls.length+",&quot;../extern.files.app/icons/blank.png&quot;,this)'>Untitled</a></li>");

	allFilesUrls.push("");
	$("#accordion0").removeClass("hidden");
	$("#projectFiles0 > ul").addClass("collapsibleList");
	CollapsibleLists.applyTo($("#projectFiles0 > ul")[0]);
	$("#no-file-open").addClass("hidden");
	$("#main").removeClass("hidden");
	console.log("ffirst",$("#projectFiles0 > ul > li").first());
	$("#projectFiles0 > ul > li").first().find("a").trigger("click");
//setTimeout(function(){  }, 1000);
	//newEditor("","","../extern.files.app/icons/blank.png",true,$("#projectFiles0 > ul").first(),true);
	//handleDocumentChange("Untitled");
}

function readFileIntoEditor(theFileEntry,language,fileIcon,openInNewTab,fileDiv) {

	//var openInNewTab = newTab;
 //editor = document.getElementById('editor'+currentEditorID).editor;
	//console.log("theFileEntry: '"+theFileEntry+"'");
	if (theFileEntry == '') { // Empty new file
		if (openInNewTab) {
			console.log("isnewtab");
			newEditor("",language,fileIcon,true,fileDiv,true);
		} else {
			console.log("is not newtab");
			editor.setValue("");
		}
	handleDocumentChange("Untitled");
	} else {
  fs.readFile(theFileEntry, function (err, data) {
    if (err) {
      console.log("Read failed: " + err);
    }

	//console.log("File Read success: ",openInNewTab);

	canWrite(theFileEntry, function(err, hasWritePermissions) {
  		console.log(hasWritePermissions); // true or false
		if (openInNewTab) {
			console.log("isnewtab");
			newEditor(String(data),language,fileIcon,hasWritePermissions,fileDiv,false);
		} else {
			console.log("is not newtab");
			editor.setValue(String(data));
		}
	handleDocumentChange(theFileEntry);
	});

    //handleDocumentChange(theFileEntry);

    /*editor.savedChanges = String(data);
	console.log("gets hereK");
    
	editor.edited = false;

	editor.onDidChangeModelContent(function (e) {
	//console.log("changed",editor.getValue());
		if (editor.savedChanges != editor.getValue()) {
		if (!editor.edited) {
		console.log("edited triggered");
  		//mySecondTextArea.value = cm.getValue();
		    //document.getElementById("sub_title").innerHTML = win.title+"*";
    		document.title = win.title+"*";
		win.title = win.title+"*";
		$("#newTabText"+editor.editorID).text(win.title);
		editor.edited = true;
		}
		
	} else if (editor.edited) {
		win.title = win.title.substring(0, win.title.length - 1);
		    //document.getElementById("sub_title").innerHTML = win.title;
    		document.title = win.title;
		win.title = win.title;
		$("#newTabText"+editor.editorID).text(win.title);
		editor.edited = false;
		
	}
  //render();
});*/
	console.log("editor lang",editor);
    //editor.refresh();
    //savedChanges = editor.getValue();
    //toggleSearch(true);
  });
}
}

function handleDocumentChange(title) {
   //editor = document.getElementById('editor'+currentEditorID).editor;
  var mode = "javascript";
  var modeName = "JavaScript";
  editor.theFileEntry = title;
  //console.log("editor...",editor);
  if (title) {
    title = title.match(/[^/]+$/)[0];

	if (!editor.hasWritePermissions)
		title += " [Read-Only]";
    //document.getElementById("sub_title").innerHTML = title;
	win.title = title;
    document.title = title;
    $('#newTabText'+currentEditorID).text(title);
    editor.title = title;
    if (title.match(/.json$/)) {
      mode = {name: "javascript", json: true};
      modeName = "JavaScript (JSON)";
    } else if (title.match(/.html$/)) {
      mode = "htmlmixed";
      modeName = "HTML";
    } else if (title.match(/.css$/)) {
      mode = "css";
      modeName = "CSS";
    }
  } else {
    //document.getElementById("sub_title").innerHTML = "DevKit";
    win.title = "DevKit";
    document.title = "DevKit";
    editor.title = "DevKit";
  }

	editor.savedChanges = editor.getValue();
	editor.edited = false;
}

//win.showDevTools();

function writeEditorToFile(editor, theFileEntry, isUntitledFile) {
 //editor = document.getElementById('editor'+currentEditorID).editor;
  //var str = editor.getValue();
	//console.log("the entry",theFileEntry);
  fs.writeFile(theFileEntry, editor.getValue(), function (err) {
    if (err) {
      console.log("Write failed: " + err);
      return;
    }

    handleDocumentChange(theFileEntry);
	editor.newFileUnsaved = false;
	if (isUntitledFile) {
		$(editor.fileDiv).text(editor.title);
		var icon = assignIcon(editor.title,false);
		$(editor.fileDiv).parent().find("img").attr("src",icon);
		$(editor.fileDiv).attr("icon",icon);
		$(".tabNavs.active").find(".tabIcon").attr("src",icon)
		if (editor.language == "") {
			var language = detectLanguage(editor.fileDiv,theFileEntry);
	 		setEditorLanguage(language);
		}
	}
    console.log("Write completed.");
  });
}

function detectLanguage(fileDiv,theFileEntry) {
		var fileTypeMimeRaw = execSync('file --mime-type -b "'+theFileEntry+'"').toString();
	var fileMimeTypes = fileTypeMimeRaw.replace(/\s+/g,'').split("/");
	console.log("fileTypeMimeRaw",fileTypeMimeRaw);
	console.log("fileTypeMimeRaw",fileMimeTypes);
	console.log("fileDiv",fileDiv);

	var language = "";

	if (fileTypeMimeRaw.indexOf("text/plain") != -1) { //We either failed to figure it out here or it's a plain text file. Let's assume we failed first
		console.log('$(fileDiv).attr("icon") lang: ',$(fileDiv).attr("icon"));
		if ($(fileDiv).attr("icon").indexOf("java script.png") != -1) {
			console.log("found javascript");
			language = "javascript";
		} else 	if ($(fileDiv).attr("icon").indexOf("compile instructions.png") != -1) {
			language = "ini"; //For package.json, I will set it to ini sine that seems to be the closest match I can think of that would work
		} else 	if ($(fileDiv).attr("icon").indexOf("css.png") != -1) {
			language = "css";
		} else 	if ($(fileDiv).attr("icon").indexOf("pthon code.png") != -1) {
			language = "python";
		}
	} else {
		console.log("detected as other");
		if (fileTypeMimeRaw.indexOf("x-c") != -1) { //C or CPP
			language = "cpp";
		} else if (fileTypeMimeRaw.indexOf("python") != -1) { //Python
			language = "python";
		} else if (fileTypeMimeRaw.indexOf("html") != -1) { //HTML
		console.log("detected as html");
			if ($(fileDiv).text().indexOf(".php") != -1) { //PHP is usually detected as html
				language = "php";
			} else {
				language = "html";
			}
			if ($(fileDiv).attr("icon").indexOf("java script.png") != -1) { //Sometimes JS is detected as html
			language = "javascript";
			console.log("set as js");
		}
		}
	}

	//All fails here is the last ditch effort

	if (language == "") {
		if ($(fileDiv).attr("extension") == "md") {
			language = "markdown";
		}

	}

	return language;
}

var onChosenFileToOpen = function(theFileEntry,fileDiv) {
$("#no-file-open").addClass("hidden");
  $("#allTabs").removeClass("hiddenOpacity");
  console.log("theFileEntry",theFileEntry);

var language = detectLanguage(fileDiv,theFileEntry);
	

	readFileIntoEditor(theFileEntry,language,$(fileDiv).attr("icon"),true,fileDiv); //Added for now, remove it later
/*editor = document.getElementById('editor'+currentEditorID).editor;
if (editor.edited) {
newEditor();
setTimeout(function(){ 
				  setFile(theFileEntry, true);
  readFileIntoEditor(theFileEntry);
  editor.edited = false;
			}, 1000);

} else {
  setFile(theFileEntry, true);
  readFileIntoEditor(theFileEntry);
  editor.edited = false;
}*/

};

function insertCode(codeToInsert) {
	editor.focus()
        editor.trigger('keyboard', 'type', {text: codeToInsert});

}

function handleNewButton() {
 /*editor = document.getElementById('editor'+currentEditorID).editor;
  if (false) {
    newFile();
    editor.setValue("");
  } else {
    var x = window.screenX + 10;
    var y = window.screenY + 10;
    window.open('main.html', '_blank', 'screenX=' + x + ',screenY=' + y);
  }*/
}

function handleOpenButton() {
	choosingNewProjectLocation = false;
  $("#openDirectory").trigger("click");
}

function handleSaveAsButton() {
	$("#saveFile").trigger("click");
}

function handleChooseProjectDirectoryButton() {
	choosingNewProjectLocation = true;
  $("#openDirectory").trigger("click");
}

function handleSaveButton() {
//editor = document.getElementById('editor'+currentEditorID).editor;
  if ( editor.hasWritePermissions) {

	if (editor.newFileUnsaved)
    		$("#saveFile").trigger("click");
	else
		if (editor.theFileEntry)
    			writeEditorToFile(editor,editor.theFileEntry,false);
  } else {
    		//$("#saveFile").trigger("click"); //Since the file is read only wanted to trigger a save as kind of thing, but there is no point because we don't even edit the file. If the user wants to save as they will trigger save as themselves
  }
}





function openSavePopupDialogue() {
	closePopupDialogue();
	$("#fileSaveDialogue").removeClass("hidden");
	$("#diagueBoxes").removeClass("hidden");
}

function openBuildDialogue(buildDirectory) {
	selectedDirectoryForBuilding = buildDirectory;
	closePopupDialogue();
	$("#packageExistsWarning").addClass("hidden");
	$(".done-build-btn").addClass("hidden");
	$("#compileInProgress").addClass("hidden");
	$("#compileFinished").addClass("hidden");
	$("#compileFinishedError").addClass("hidden");
	$("#compileNoBuildFinished").addClass("hidden");
	$(".build-btn").removeClass("hidden");
	$("#compileConfirmation").removeClass("hidden");
	$("#buildAppDialogue").removeClass("hidden");
	$("#diagueBoxes").removeClass("hidden");
	//findAllFilestoBuild(selectedDirectoryForBuilding,filesToBuild);
	console.log("filesToBuild",filesToBuild);
var pjson = JSON.parse(fs.readFileSync(buildDirectory+'/package.json', 'utf8'));
	if (fs.existsSync(buildDirectory+"/"+pjson.name+".xapp")) {
		$("#packageExistsWarning").removeClass("hidden");
	}
}

function openNewProjectPopupDialogue() {

	closePopupDialogue();
	$("#newProject").removeClass("hidden");
	$("#diagueBoxes").removeClass("hidden");
}

	

function closePopupDialogue(doNotResetprojectValues) {

	$("#diagueBoxes").addClass("hidden");
	$(".modal-dialog").addClass("hidden");
	$("#buildAppDialogue").addClass("hidden");
	$("#newItemWindow").addClass("hidden");
	$("#errorDirectoryExists").addClass("hidden");
	$("#createNewDirectory").prop("disabled",true);
	if (!doNotResetprojectValues) {
		$("#newProjectName").val("");
		$("#teamDeveloperProjectName").val("");
	}
	$("#errorProjectExists").addClass("hidden");
	$("#createNewProject").prop("disabled",true);
	$("#newItemName").val("");
	
}

function closeTab(tabId) {

		for (var i=0; i< editors.length;i++){	
			if ("#tabNave"+editors[i].id == "#tabNave"+tabId) {
				var tabPos = i;
				if (i !=0) {
					var clickID = editors[i-1].id;
					//setTimeout(function(){$("#tabNave"+clickID ).trigger('click');}, 2000);
					$("#tabNave"+clickID )[0].click();
					editors.splice(tabPos,1);
					//$('#myCarousel').carousel(); 
				}else {
					if (editors.length == 1){
						win.close();
						editors.splice(tabPos,1); //Literally useless, incase window doesn't close for whatever reason
					}else {
						var clickID = editors[i+1].id;
					//setTimeout(function(){$("#tabNave"+clickID ).trigger('click');}, 2000);
						$("#tabNave"+clickID )[0].click();
						editors.splice(tabPos,1);
						//$("#tabNave"+(i+1)).trigger('click');
					}
				}
				break;
			}	
		}
		
		availableTabs.splice(tabPos, 1);
		
		for (var i=0; i<availableTabs.length;i++){
			$( "#tabNave"+availableTabs[i] ).attr("data-slide-to", i);
		}

$("#tabNave"+tabId).parent().fadeOut();
		setTimeout(function(){$("#tabNave"+tabId).parent().remove();$("#view"+tabId).remove(); }, 1000);
}


function assignIcon(fileName,isDirectory) {

	if (isDirectory)
		var icon = "../extern.files.app/icons/"+win.resolveFileType("*folder*",true);
	else
		var icon = "../extern.files.app/icons/"+win.resolveFileType(fileName.split('.').pop(),true);

	return icon;

}

var getAllAvailableLanguages = function() {
	var path = "/usr/eXtern/systemX/apps/extern.devkit.app/node_modules/monaco-editor/dev/vs/basic-languages";
  var dir = fs.readdirSync(path);
  for (var i = 0; i < dir.length; i++) {
    var name = dir[i];
    var target = path + '/' + name;

    var stats = fs.statSync(target);
    if (stats.isDirectory()) {
      $("#availableLanguagesList").append('<li><a href="javascript:void(0);" onclick="setEditorLanguage(&quot;'+name+'&quot;)" >'+name+'</a></li>')
    }
  }
}

getAllAvailableLanguages();

//walkRootDirectory



function openDIrectory(id,div) {
	console.log("openDIrectory called",$(div).parent().find("ul").children().length);
	if ($(div).parent().find("ul").children().length == 0) {
	
	var filetree = {};
	walkDirectory(allDirectories[id].location,filetree,$(div).parent().find("ul")[0]);
	//CollapsibleLists.applyTo(allFiles);
	$(div).parent().addClass("collapsibleListOpen"); //class="collapsibleListOpen"
	//CollapsibleLists.applyTo(allDirectories[id].location,filetree,$(div).parent()[0]);
	//CollapsibleLists.applyTo($("#projectFiles0 > ul")[0]);
	CollapsibleLists.applyTo($(div).parent().find("ul")[0]);
	setTimeout(function(){ 
	var objDiv = $("#files").parent()[0]; 
	objDiv.scrollLeft = objDiv.scrollWidth; //Scroll to the end, useful when user is deep into the filetree of the directory
	}, 50); //Delay because we need to give CollapsibleLists time to finish processing
	console.log("openDIrectory finished");
	}
}

/*The function below walkDirectory() technically doesn't "walk" through the directory anymore. It seemed inefficient to do so. Like whenever you would load massive projects (let's say the whole Desktop partof this OS, you would spend a long time waiting, would fail to finish if it can't read some file because of permissions and if it did finish loading then you would have a lot of file lisitings in directories you aren't even interested in. So to fix this, I made it only load files in the directory the user clicks instead. The Older function is still available as walkDirectoryOld() below if you are interested. Will be removed soon though.*/

var walkDirectory = function(path, obj, element) {
  var dir = fs.readdirSync(path);
  for (var i = 0; i < dir.length; i++) {
    var name = dir[i];
    var target = path + '/' + name;

    var stats = fs.statSync(target);
    if (stats.isFile()) {
      var icon = assignIcon(name,false);
      $(element).append("<li><span class='fileIcon'><img class='svgIcon' src='"+icon+"'></span><a href='#' icon='"+icon+"' extension='"+name.split('.').pop()+"' class='projectFile' onclick='openFile("+allFilesUrls.length+",&quot;"+icon+"&quot;,this)'>"+name+"</a></li>");
	if (name == "package.json") {
		element.isExternApp = true;
	}
      allFilesUrls.push(target);
      if (name.slice(-3) === '.js') {
        //obj[name.slice(0, -3)] = require(target);
      }
    } else if (stats.isDirectory()) {
      obj[name] = {};
      var icon = assignIcon(name,true);
      var newDirectory = document.createElement("LI");
	//newDirectory.onclick='openDIrectory("+allDirectories.length+",this)';
      $(newDirectory).append("<span onclick='openDIrectory("+allDirectories.length+",this)'><span class='folderIcon'><img class='svgIcon' src='"+icon+"'></span><a href='#'><span>"+name+"</span></a></span><span> <button class='btn btn-alt m-r-5 new-dir-btn' title='New Folder' onclick='addNewDirectoryTo("+allDirectories.length+")'><span class='icon'>&#61943;</span></button></span>");
      var newDirectoryList = document.createElement("UL");
      //walkDirectory(target, obj[name], newDirectoryList);
	var dirObj = {
		element: newDirectory,
		location: target
	}
	allDirectories.push(dirObj);
      newDirectory.appendChild(newDirectoryList);
      element.appendChild(newDirectory);
    }
  }
}


var walkDirectoryX = function(path, obj, element) {
  var dir = fs.readdirSync(path);
  for (var i = 0; i < dir.length; i++) {
    var name = dir[i];
    var target = path + '/' + name;

    var stats = fs.statSync(target);
    if (stats.isFile()) {
      var icon = assignIcon(name,false);
      $(element).append("<li><span class='fileIcon'><img class='svgIcon' src='"+icon+"'></span><a href='#' icon='"+icon+"' class='projectFile' onclick='openFile("+allFilesUrls.length+",&quot;"+icon+"&quot;,this)'>"+name+"</a></li>");
	if (name == "package.json") {
		element.isExternApp = true;
	}
      allFilesUrls.push(target);
      if (name.slice(-3) === '.js') {
        //obj[name.slice(0, -3)] = require(target);
      }
    } else if (stats.isDirectory()) {
      obj[name] = {};
      var icon = assignIcon(name,true);
      var newDirectory = document.createElement("LI");
      $(newDirectory).append("<span class='folderIcon'><img class='svgIcon' src='"+icon+"'></span><a href='#'><span>"+name+"</span></a>");
      var newDirectoryList = document.createElement("UL");
      walkDirectory(target, obj[name], newDirectoryList);
      newDirectory.appendChild(newDirectoryList);
      element.appendChild(newDirectory);
    }
  }
};



var findAllFilestoBuild = function(path, obj) {
  var dir = fs.readdirSync(path);
  for (var i = 0; i < dir.length; i++) {
    var name = dir[i];
    var target = path + '/' + name;

		if (fs.existsSync(target)) { //I know this seems redudant but it's not trust me. I think there is some files with some permissions that freak fs out
		var stats = fs.statSync(target);
    if (stats.isFile()) {
      if (name.split('.').pop() == "js") {
				obj.push(target);
			}
    } else {
			findAllFilestoBuild(target,obj);
		}
		}
    
  }
};

/*function compressApp(appDirectory,apDestination,packagePass,callback) {
	    var exec = require('child_process').exec,
                   child;
            child = exec('zip -P '+packagePass+' -r '+apDestination+' ./',{cwd: appDirectory},function (error, stdout, stderr)
    {//process.cwd()+"/blur_app.sh"
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
                
    if (error !== null) {
      console.log('exec error: ' + error);
    } else {
        
       console.log('SUCCESS: compiled');
        
        
        
        
    }       
});
}*/

function appCompiled(success) {
	if (success) {
		$("#compileInProgress").addClass("hidden");
		$("#compileFinished").removeClass("hidden");
		$(".done-build-btn").removeClass("hidden");
		
	} else {
		$("#compileInProgress").addClass("hidden");
		$("#compileFinished").removeClass("hidden");
		$("#compileFinishedError").removeClass("hidden");
	}
}

function packageApp(appDirectory,apDestination) {
	// Use zip -r app.zip appDirectory

	console.log("appDirectory",appDirectory);
	console.log("apDestination",apDestination);
	console.log("name",appDirectory.split("/").pop());

	if (fs.existsSync(apDestination)) {
		fs.unlink(apDestination, (err) => {
            		if (err) {
				appCompiled(false);
                		console.log("failed to delete file:", err);
            		} else {
				win.compressApp(appDirectory,apDestination,appCompiled);
			}
		});
		//$("#packageExistsWarning").removeClass("hidden");
	} else {
		win.compressApp(appDirectory,apDestination,appCompiled);
	}

	

/*
	var exec = require('child_process').exec;
var child = exec('zip -p pass123 ccat-command.zip ccat-1.1.0/');
child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
});
child.stderr.on('data', function(data) {
    console.log('stdout: ' + data);
});
child.on('close', function(code) {
    console.log('closing code: ' + code);


});*/
}

/*function readPackageJson(appLocation) {
	fs.readFile(appLocation, function (err, data) {

	});
}*/

function buildProject() {
	var pjson = JSON.parse(fs.readFileSync(selectedDirectoryForBuilding+'/package.json', 'utf8'));
	
	$(".build-btn").addClass("hidden");
	$("#compileConfirmation").addClass("hidden");
	$("#compileInProgress").removeClass("hidden");
	if (pjson.settings["build-type"] == "compile-only") {
		findAllFilestoBuild(selectedDirectoryForBuilding,filesToBuild);
		generateBinary(0);
	} else if (pjson.settings["build-type"] == "direct-build") {
		packageApp(selectedDirectoryForBuilding,selectedDirectoryForBuilding+"/"+pjson.name+".xapp");
	} else if (pjson.settings["build-type"] == "compile-build") {
		findAllFilestoBuild(selectedDirectoryForBuilding,filesToBuild);
		generateBinary(0,true);

	}
}

function generateBinary(currentFilePosition,buildPackage) {
	var currentFullFileName = filesToBuild[currentFilePosition].split('/').pop();
	var currentFileNameNoExtension = currentFullFileName.split('.')[0];
	var currentFileAsBin = filesToBuild[currentFilePosition].replace(currentFullFileName,"")+currentFileNameNoExtension+".bin";

	var exportToBin = execSync('/usr/eXtern/NodeJs/nwjc "'+filesToBuild[currentFilePosition]+'" "'+currentFileAsBin+'"');
	currentFilePosition++;
	if (currentFilePosition < filesToBuild.length) {
		generateBinary(currentFilePosition);
	} else if (buildPackage) {
		//build to installable package code here
		var pjson = JSON.parse(fs.readFileSync(selectedDirectoryForBuilding+'/package.json', 'utf8'));	packageApp(selectedDirectoryForBuilding,selectedDirectoryForBuilding+"/"+pjson.name+".xapp");
	} else {
		//show successful compilation but no build
		console.log("done compiling");
		$("#compileInProgress").addClass("hidden");
		$("#compileNoBuildFinished").removeClass("hidden");
		$(".done-build-btn").removeClass("hidden");
	}
	
}

function saveJsLinkerToBinaryFile(location, name) {
  fs.writeFile(theFileEntry, editor.getValue(), function (err) {
    if (err) {
      console.log("Write failed: " + err);
      return;
    }

    handleDocumentChange(theFileEntry);
	editor.newFileUnsaved = false;
	if (isUntitledFile) {
		$(editor.fileDiv).text(editor.title);
		var icon = assignIcon(editor.title,false);
		$(editor.fileDiv).parent().find("img").attr("src",icon);
		$(editor.fileDiv).attr("icon",icon);
		$(".tabNavs.active").find(".tabIcon").attr("src",icon)
		if (editor.language == "") {
			var language = detectLanguage(editor.fileDiv,theFileEntry);
	 		setEditorLanguage(language);
		}
	}
    console.log("Write completed.");
  });
}

//walkDirectory(dirs, filetree, allFiles);
//console.log(filetree);



//console.log("allFiles",allFilesUrls);

win.onOpenFiles = function(files){

console.log("on open files",files);

for (var i = 0; i < files.length; i++) {

	
if (fs.statSync(files[i].toString()).isDirectory()) {
openProject(files[i].toString());
} else {
	var fileName  = files[i].toString().substring(files[i].toString().lastIndexOf('/')+1);
	var icon = assignIcon(fileName,false);
	if( $('#projectFiles0 > ul').is(':empty') ) {
		var wasEmpty = true;
	} else {
		var wasEmpty = false;
	}

	$("#projectFiles0 > ul").prepend("<li><span class='fileIcon'><img class='svgIcon' src='"+icon+"'></span><a href='#' icon='"+icon+"' class='projectFile' onclick='openFile("+allFilesUrls.length+",&quot;"+icon+"&quot;,this)'>"+fileName+"</a></li>");

	allFilesUrls.push(files[i].toString());
	$("#accordion0").removeClass("hidden");
	$("#projectFiles0 > ul").addClass("collapsibleList");
	CollapsibleLists.applyTo($("#projectFiles0 > ul")[0]);
	$("#no-file-open").addClass("hidden");
	$("#main").removeClass("hidden");
	console.log("ffirst",$("#projectFiles0 > ul").first());

	if (files.length == 1)
		setTimeout(function(){console.log("clicking.."); $("#projectFiles0 > ul > li").first().find("a").trigger("click");}, 1000); //Auto open if its just 1 file opened
	

}

}


$("#files").removeClass("verticalCenter");

//CollapsibleLists.apply();

//$("#projectFiles0").append(allFiles);

}

function setEditorLanguage(language) {
	console.log("lang: ",language);
	var model = editor.getModel();
	console.log("langB: ",model);
	console.log("langV: ",monaco);
	monaco.editor.setModelLanguage(editor.getModel(),language);
	//$(".view-lines").css("fontSize",20);
	//$(".margin-view-overlays").css("fontSize",20);
	//editor.updateOptions({ fontSize: 20});
	console.log("success");
	editor.language = language;
	setSideBarLanguage();
}

function showSidebarAndEditors() {
	setTimeout(function(){ //Delay to avoid lag from the editor still finishing up loading things
		$("#tabNav").removeClass("hidden");
		$("#tabNav").removeClass("hiddenOpacity");
		$("#allTabsC").removeClass("hiddenOpacity");
		$("#sidebar").css('left','0');
		}, 100);
}

function setSideBarLanguage() {
	var setLang = editor.language;
	if (editor.language == "javascript") {
		setLang = "JS";
	}

	if (editor.language == "html") {
		setLang = "HTM";
	}

	if (editor.language == "markdown") {
		setLang = "MD";
	}

	if (editor.language != "") {
		$("#currentLanguageFull").text(editor.language);
		$("#currentLangIcon").text(setLang);
	} else {
		$("#currentLanguageFull").text("No Language Set");
		$("#currentLangIcon").text("TXT");
	}

	$("#currentLang").removeClass("hidden");

	

}


function newEditor(editorData,language,fileIcon,hasWritePermissions,fileDiv,isNewFile) {
lastEditorID++;

if (lastEditorID == 0) {
var classes = "active";
} else {
var classes = "";
}

currentEditorID = lastEditorID;

//$("#allTabsC").append('<div id="view'+currentEditorID+'" class="item '+classes+'"><div id="editor'+currentEditorID+'" class="editor"></div></div>');

$("#tabNav").append('<li class="tabNavs '+classes+'"><span id="tabNave'+lastEditorID+'" class="tabsLi" editorID='+currentEditorID+' initd="false"  data-target="#allTabs" data-slide-to="'+availableTabs.length+'"><span><img id="tabicon'+currentEditorID+'" class="tabIcon" src="'+fileIcon+'"></span><span id="newTabText'+currentEditorID+'" class="ntabText">Untitled</span></span> <span class="closeTabB"><a href="#" class="closeTabLi" onclick="closeTab('+currentEditorID+')"><img src="../../Shared/CoreIMG/icons/actions/close-icon.png"></a></span></li>');

availableTabs.push(currentEditorID);

//$("#allTabsC").append('<div id="editor'+currentEditorID+'" class="editor" style="width:100%;height:100%;"></div>');

$("#allTabsC").append('<div id="view'+currentEditorID+'" class="item '+classes+'"><div id="editor'+currentEditorID+'" class="editor" style="width:100%;height:100%;"></div></div>');

$('#tabNave'+currentEditorID)[0].addEventListener('click', function(e) {
			
			if (e.target.className.indexOf("fa") == -1 && e.target.className.indexOf("closeTabB") == -1 && e.target.className.indexOf("closeTabLi") == -1) {
				currentTab = $(this).attr("id").replace("tabNave","");
				currentEditorID = $(this).attr("editorID");

				if ($(this).attr("initd") == "false")
					$(this).attr("initd","true")
				else {
				for (var i = 0; i < editors.length; i++)
					if (editors[i].id == currentEditorID)
						editor = editors[i];

						setSideBarLanguage();


				console.log("currentEditorID",currentEditorID);
				console.log("editorID",editor.id);
				}
				$(".tabNavs").removeClass("active");
				$(this).parent().addClass("active");
			}else {
				e.preventDefault();
			}
		});

$('#tabNave'+currentEditorID)[0].click();


//setTimeout(function(){ 
		editor = monaco.editor.create(document.getElementById('editor'+currentEditorID), {
			value: editorData,//.join('\n'),
			minimap: {
				showSlider: "always"
			},
			scrollbar: {
				vertical: "hidden",
				verticalScrollbarSize: 0,
				horizontalScrollbarSize: 10,
				useShadows: true
			},
			//fontSize: 20,
			readOnly: !hasWritePermissions,
			language: language
		});

		editor.hasWritePermissions = hasWritePermissions;
		editor.newFileUnsaved = isNewFile;
		editor.language = language;
		editor.fileDiv = fileDiv;

		console.log("editor",editor);
		editor.id = currentEditorID;
		editor.edited = false;
editor.editorID = currentEditorID;

	editor.savedChanges = editor.getValue();

	setSideBarLanguage();

	editor.addAction({
      id: 'save-to-file',
      label: 'Save',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
      contextMenuGroupId: 'snippets',
      contextMenuOrder: 1.5,
      run: function (ed) {
        handleSaveButton();
      }
});

	editor.onDidChangeModelContent(function (e) {
	//console.log("changed",editor.getValue());
		if (editor.savedChanges != editor.getValue()) {
		if (!editor.edited) {
		console.log("edited triggered");
  		//mySecondTextArea.value = cm.getValue();
		    //document.getElementById("sub_title").innerHTML = win.title+"*";
    		document.title = win.title+"*";
		win.title = win.title+"*";
		$("#newTabText"+editor.editorID).text(win.title);
		editor.edited = true;
		}
		
	} else if (editor.edited) {
		win.title = win.title.substring(0, win.title.length - 1);
		    //document.getElementById("sub_title").innerHTML = win.title;
    		document.title = win.title;
		win.title = win.title;
		$("#newTabText"+editor.editorID).text(win.title);
		editor.edited = false;
		
	}
  //render();
});

editors.push(editor);
showSidebarAndEditors();

//}, 2000);

//initContextMenu();


	

//document.getElementById('editor'+currentEditorID).editor = editor;

  //newFile();
}

function undo() {
	editor.trigger('aaaa', 'undo', 'aaaa');
	editor.focus();
}

function redo() {
	editor.trigger('aaaa', 'redo', 'aaaa');
	editor.focus();
}

function copy() {
	editor.focus();
	document.execCommand('copy');
}

function cut() {
	editor.focus();
	document.execCommand('cut');
}

function paste() {
	editor.focus();
	document.execCommand('paste');
}

function discardChanges() {
	win.close();
}

var onChosenFileToSave = function(theFileEntry) {
  //setFile(theFileEntry, true);
  writeEditorToFile(editor,theFileEntry,true);
};

onload = function() {





  setFontSize(fontSize);
$("#sidebar").css('left','-50');

  newButton = document.getElementById("new");
  openButton = document.getElementById("open");
  saveButton = document.getElementById("save");

  newButton.addEventListener("click", handleNewButton);
  openButton.addEventListener("click", handleOpenButton);
  saveButton.addEventListener("click", handleSaveButton);

  $("#saveFile").change(function(evt) {
    onChosenFileToSave($(this).val());
  });
  $("#openFile").change(function(evt) {
    onChosenFileToOpen($(this).val());
  });

  $("#openDirectory").change(function(evt) {
	console.log("still triggered");
	if ($(this).val() != "") {
	if (choosingNewProjectLocation) {
		selectedDirectoryForNewProject = $(this).val();
		$("#selectedDirectoryForNewProject").text(selectedDirectoryForNewProject);
	} else
    		openProject($(this).val());
	}

	choosingNewProjectLocation = false;
  });

/*$(window).keypress(function(event) {
    if (!(event.which == 115 && event.ctrlKey) && !(event.which == 19)) return true;
    handleSaveButton();
    event.preventDefault();
    return false;
});*/

require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' }});

	require(['vs/editor/editor.main'], function() {

	/*monaco.editor.defineTheme('eXtern-OS-Dark', {
		base: 'vs', // can also be vs-dark or hc-black
		inherit: true, // can also be false to completely replace the builtin rules
		rules: [
		{ background: '1e1e1e69'}
	]
	});
		monaco.editor.setTheme('eXtern-OS-Dark');*/

	monaco.editor.defineTheme('myTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [{ token: '',  background: '#1e1e1e00' },
	{ token: 'comment', foreground: '7ce052' },
	{ token: 'constant', foreground: '008bff' },
	{ token: 'tag', foreground: '008bff' },
	{ token: 'metatag.html', foreground: '008bff' },
	{ token: 'metatag.xml', foreground: '008bff' },
	{ token: 'keyword', foreground: '008bff' },
	{ token: 'keyword.flow.scss', foreground: '008bff' },
	{ token: 'meta.tag', foreground: 'ff8f61' },
	{ token: 'string.value.json', foreground: 'ff8f61' },
	{ token: 'attribute.value', foreground: 'ff8f61' },
	{ token: 'string', foreground: 'ff8f61' },
	{ token: 'keyword.json', foreground: 'ff8f61' },
	
	],
    colors: {
        'editor.background': '#1e1e1e69',
        'editorSuggestWidget.background': '#1e1e1e69',
        'editorSuggestWidget.border': '#6f6d6d2e',
        'editor.inactiveSelectionBackground': '#88000015',
        'editorWidget.background': '#1e1e1ed6',
        'dropdown.background': '#1e1e1e69',
    }
});

/*
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#ffffff',
*/
monaco.editor.setTheme('myTheme');



		
	});

	win.close_button.onclick = function() {
		var editedFiles = [];
		for (var i = 0; i < editors.length; i++) {
			if (editors[i].edited) {
				editedFiles.push(editors[i].title);
			}
		}
		if (editedFiles .length != 0) {
			var editedFilesTitles = "";
			for (var i = 0; i < editedFiles .length; i++) {
				if (i != (editedFiles .length-1) && (i != 0))
					editedFilesTitles += ", ";
				else {
					if (editedFiles .length > 1 && (i != 0))
						editedFilesTitles += " and ";
				}
				editedFilesTitles += '"'+editedFiles[i]+'"';
			}

			$("#notSavedFiles").text(editedFilesTitles);
          		openSavePopupDialogue();
		} else
			win.close();
	console.log("lol");
      };


	$("#newProjectName").keyup(function (e) {
		var dirExists = false;
		if ($("#newProjectName").val() != "") {
			$("#errorProjectExists").addClass("hidden");
			$("#createNewProject").prop("disabled",false);
			fs.stat(selectedDirectoryForNewProject+"/"+$("#newProjectName").val(), function(err) {

				console.log("checked A");
				if (!err)
					dirExists = true; //console.log("err file or dir exists");
				else if (error.code == 'ENOENT') {
					dirExists = true; //console.log("err file or dir exists 2");
				}
				console.log("checked");
				if (dirExists) {
					$("#errorProjectExists").removeClass("hidden");
					$("#createNewProject").prop("disabled",true);
				} else {
					$("#errorProjectExists").addClass("hidden");
					$("#createNewProject").prop("disabled",false);
				}
				dirExists = false;
					

			});
			} else {
				$("#errorProjectExists").addClass("hidden");
				$("#createNewProject").prop("disabled",true);
			}
	});


	$("#newItemName").keyup(function (e) {
		var dirExists = false;
		if ($("#newItemName").val() != "") {
			$("#errorDirectoryExists").addClass("hidden");
			$("#createNewDirectory").prop("disabled",false);
			fs.stat(selectedDirectoryForNewDirectory.location+"/"+$("#newItemName").val(), function(err) {

				console.log("checked A");
				if (!err)
					dirExists = true; //console.log("err file or dir exists");
				else if (error.code == 'ENOENT') {
					dirExists = true; //console.log("err file or dir exists 2");
				}
				console.log("checked");
				if (dirExists) {
					$("#errorDirectoryExists").removeClass("hidden");
					$("#createNewDirectory").prop("disabled",true);
				} else {
					$("#errorDirectoryExists").addClass("hidden");
					$("#createNewDirectory").prop("disabled",false);
				}
				dirExists = false;
					

			});
			} else {
				$("#errorDirectoryExists").addClass("hidden");
				$("#createNewProject").prop("disabled",true);
			}
	});
	

	

/*win.on('close', function() {
	//win.close(true);
	openSavePopupDialogue();
	console.log("lol");
//return false;
});*/
};

