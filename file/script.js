/*      
             
      ,%%%%%%#                                              
    .&&&&%%%%%%##                                           
    @@&&&&%%%%%%%%#                                         
     @@@&&&&&%&@%%%%##                                      
       @@@@@@&&%%%%%%%%######                               
            @@@&&&&%%%%%%%#%%%%%%%%%%%%%%%#%%%%%#%#####     
              @@&&&&&%%%%%%%#%%%%%%%%%%%%%%%%%%%%####       
               @&&&&&&&%%%%%%%#%%%%%%%%%%%%%%%%%%##         
               #@&&&&&&&&%%@@%%%%%%%%#######%%%###          
                @&&&&&&&%%%%&%%%%%%%%######%%%%%%(          
               .@&&&&&&&&%%%%%&&&%%%%%%%%%%%%%%%%,          
               @@&&&&&&&%&&&%&&&&&&%%%%%%%%%%%%%%#          
               @@@&&&&&&&&&&&&&&&&&&&%%&&&%&%%%%%%          
              &@@@@&&&&&&&&&&#       &@&&&&&&&&%%%#         
               /@@@@&&&&                   @@@&&%%%#        
                                               @@&&%%#      
                                                   &&&#     
                                                                
   _____  _____  _   _ 
  / ____||_   _|| \ | |             
 | |       | |  |  \| |             chiedo scusa a qualsiasi  
 | |       | |  | . ` |             programmatore vero che 
 | |____  _| |_ | |\  |             vedrà questa roba <3
  \_____||_____||_| \_|
                                                                                                                                                                      
*/






                     
                     

var beep1 = new Audio("./file/beep-1.mp3");
var beep5 = new Audio("./file/countdown.mp3");
var beep15 = new Audio("./file/beep-09.mp3");
var sec;
var sec0;
var secRest;
var secPre;
var secPre0;
var startTimeHour;
var startTimeMin;

function getTime() {
    startTimeHour=document.getElementById("time-set-hour").value;
    startTimeMin=document.getElementById("time-set-min").value;
    var now = new Date();
    var startTime=new Date(now.getFullYear(), now.getMonth(), now.getDate(), startTimeHour, startTimeMin);
    var diff= startTime.getTime() - now.getTime();
    diff = Math.floor(diff/1000);

    if (startTimeHour>23 || startTimeMin>59){
        window.alert("Inserisci un orario valido!")
        window.location.reload();
        diff=-1;
    }
    else{
        return(diff);
    }
}


function displayTime(sec){
    var minutes=Math.floor(sec/60);
    var seconds=sec%60;
    if (seconds < 10) {seconds = "0"+seconds;}
    document.getElementById("demo").innerHTML = minutes+":"+seconds;
}


function maxFontSize(initialFontSize){
    var w = window.innerWidth;
    var h = window.innerHeight;
    var timeWidth=document.getElementById("demo").clientWidth;
    var timeHeight=document.getElementById("demo").clientHeight;
    console.log("w: "+w*0.85);
    console.log("h: "+w*0.85);
    console.log("timeW: "+timeWidth);
    console.log("timeH: "+timeHeight);


    if (timeWidth<w*0.85 && timeHeight<h*0.85){
        initialFontSize++;
        document.getElementById("demo").style.fontSize = initialFontSize+"vw";
        console.log(initialFontSize);
        maxFontSize(initialFontSize);
    }
    //
    if (timeWidth>w*0.9 || timeHeight>h*0.9){
        initialFontSize--;
        document.getElementById("demo").style.fontSize = initialFontSize+"vw";
        console.log(initialFontSize);
        maxFontSize(initialFontSize);
    }
    
}

function start(){
    if (typeof intervalWork !== "undefined"){           //se gia partito azzera
        clearInterval(intervalWork)
    }
    if (typeof intervalRest !== "undefined"){           //se gia partito azzera
        clearInterval(intervalRest)
    }
    if (typeof intervalPre !== "undefined"){           //se gia partito azzera
        clearInterval(intervalPre)
    }
    
    beep15.play();
    initialFontSize=5;
    document.getElementById('modal').style.display = 'none';

    if (document.getElementById('progress-bar-checkbox').checked){
        document.getElementById("progress-bar").style.visibility="visible"
    }
    else document.getElementById("progress-bar").style.visibility="hidden";


    sec=document.getElementById("time").value*60;
    sec0=sec;
    secRest=document.getElementById("rest").value;
    secPre=getTime();
    secPre=6;
    secPre0=secPre;    

    if ((startTimeHour=="" || startTimeMin=="") && 1){         //se ora inizio o min initio vuoti parte direttamente work
        displayTime(sec);
        maxFontSize(5);
        intervalWork=setInterval(work,1000);
        //intervalRest=setInterval(rest,1000);
    }
    else{                                               //se ora inizio compilata parte prima il countdown per quell'ora
        if(secPre<0){                                        
            alert("Inserisci un orario futuro!")
            window.location.reload();
        }
        else{
            displayTime(secPre);
            maxFontSize(5);
            intervalPre=setInterval(pre,1000);
        }
    }
}

function pre(){
    secPre--;
    document.getElementById("progress-done").style.width = secPre/secPre0*100+"%";
    displayTime(secPre);
    if(secPre==65) beep1.load();
    if(secPre==60) beep1.play();
    if(secPre==10) beep5.load();
    if(secPre==5) beep5.play();
    if (secPre<0.5){
        clearInterval(intervalPre);
        if(secRest>0){
            document.getElementById("demo").innerHTML = secRest;
            maxFontSize(5);
        }
        intervalRest=setInterval(rest,1000);
    }
}

function work(){    
    sec--;
    document.getElementById("progress-done").style.width = sec/sec0*100+"%";
    displayTime(sec);

    if(sec==65) beep1.load();
    if(sec==60) beep1.play();
    if(sec==10) beep5.load();
    if(sec==5) beep5.play();
    
    if (sec<0.5){
        clearInterval(intervalWork);

        if(!document.getElementById("final-mode-checkbox").checked){
            secRest=document.getElementById("rest").value;
            if(secRest>0){
                document.getElementById("demo").innerHTML = secRest;
                maxFontSize(5);
            }

            intervalRest=setInterval(rest,1000);
        }
    }
}

function rest(){
    secRest--;
    document.getElementById("demo").innerHTML = secRest;
    if(secRest==5) beep15.load();
    if (secRest<0.5){
        beep15.play();
        clearInterval(intervalRest);
        sec=document.getElementById("time").value*60;
        displayTime(sec);
        maxFontSize(5);
        intervalWork=setInterval(work,1000);
        
    }
}






var modal = document.getElementById("modal");
/*
var btn = document.getElementById("open-modal");
btn.onclick = function() {
  modal.style.display = "block";
}*/
window.onclick = function(event) {
  if (event.target == modal) {
    //modal.style.display = "none";
    
  }
}

final=document.getElementById("final-mode-checkbox")
final.onclick = function(){
    if (final.checked){
        
        document.getElementById("rest").disabled = true;
        document.getElementById("rest").value = "0";
        document.getElementById("setting-rest").style.color="grey";
        
    }
    else {
        document.getElementById("rest").disabled = false;
        document.getElementById("rest").value = "15";
        document.getElementById("setting-rest").style.color="black";
    }
}

/*
document.addEventListener('keydown', (event) => {
    var name = event.key;
    var code = event.code;
    // Alert the key name and key code on keydown
    alert(`Key pressed ${name} \r\n Key code value: ${code}`);
}, false);
/**/


document.addEventListener('keydown', (event) => {
    var name = event.key;
    var code = event.code;
    if( document.getElementById("final-mode-checkbox").checked ){

        if (code=="KeyR"){
            if (typeof intervalWork !== "undefined"){
                clearInterval(intervalWork);
                displayTime(sec0);
                beep5.pause();
                beep5.currentTime=0;
                console.log("R press")
            
            }
        }
        if (code=="Enter" || code=="NumpadEnter"){
            beep5.pause();
            beep5.currentTime=0;
            start();
        }

        /*
        if (code=="Space"){
            if (document.getElementById("progress-done").style.visibility="hidden"){
                document.getElementById("progress-done").style.visibility="visible"
            }
            else if (document.getElementById("progress-done").style.visibility="visible"){
                document.getElementById("progress-done").style.visibility="hidden"
            }
        }
        */
       
    }
}, false);


/**/