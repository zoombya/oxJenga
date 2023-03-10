export class OXServeSocket extends WebSocket{
    abort = true;
    constructor(url){
        super(url);
    
    this.onmessage = (response) => {
        if(!this.abort){ //ignore all incomming messages when we stop the simulation
            let message = JSON.parse(response.data);
            if ("console_log" in message){
                console.log(message["console_log"]);
            }
            if ("dat_file" in message) {
                updateConfFromFile(message["dat_file"]);
                if (forceHandler) forceHandler.redraw();
            }
        }
    };


    this.onopen = (resonse) => {
        console.log(resonse);
        let connect_button =  (document.getElementById("btnConnect"));
        connect_button.style.backgroundColor = "green";
        connect_button.textContent = "Connected!";
        Metro.dialog.close('#socketConnectionsDialog');
        this.abort = false; 
    }

    this.onclose = (resonse) => {
        let connect_button =  (document.getElementById("btnConnect"));
        connect_button.style.backgroundColor = "";
        connect_button.textContent = "Connect to oxServe";
        notify("lost oxServe Connection", "warn");
        this.abort=true;
    }

    }
    // stop_simulation = () =>{
    //     this.send("abort");
    //     this.abort = true;
    // }
    // start_simulation = () => {
    //     this.abort = false;
    //     const name = 'out';
    //     let reorganized, counts, conf = {};
    //     {
    //         let {a, b, file_name, file} = makeTopFile(name);
    //         reorganized = a;
    //         counts = b;
    //         conf["top_file"] = file;
    //     }
    //     {
    //         let {file_name, file} = makeDatFile(name, reorganized);
    //         conf["dat_file"] = file;	
    //     }
    //     if (networks.length > 0) {
    //         let {file_name, file} = makeParFile(name, reorganized, counts);
    //         conf["par_file"] = file;
    //     }

    //     conf["settings"] = {};
    //     let sim_type = "";
    //     let backend = (document.getElementsByName("relaxBackend"));
    //     for(let i = 0; i < backend.length; i++) { 
                  
    //         if(backend[i].type="radio") { 
              
    //             if(backend[i].checked) 
    //                  sim_type = backend[i].value;  
    //         } 
    //     } 
        
    //     console.log(`Simulation type is ${sim_type}`);
    //     let settings_list = relax_scenarios[sim_type];

    //     if(forces.length > 0){
    //         conf["trap_file"] = forcesToString();
    //     }

    //     //set all var fields 
    //     for (let [key, value] of Object.entries(settings_list["var"])) {
            
    //         conf["settings"][key] = (document.getElementById(value["id"]) ).value;
    //         if(key === "T") conf["settings"][key] += "C";
    //     }  
        
    //     //set all const fields 
    //     for (let [key, value] of Object.entries(settings_list["const"])) {
    //         conf["settings"][key] = value["val"];    
    //     }
    //     //set all relax fields
    //     let useRelax = false;
    //     if (sim_type==="MC") useRelax = view.getInputBool("mcUseRelax");
    //     if (sim_type==="MD_GPU") useRelax = view.getInputBool("mdUseRelax");
    //     if (useRelax){
    //         for (let [key, value] of Object.entries(settings_list["relax"])) {
    //             conf["settings"][key] = (document.getElementById(value["id"])).value;
    //         }  
    //     }
        
    //     this.send(
    //         JSON.stringify(conf)
    //     );
    // }
}



export const establishConnection = () => {
    const url = "wss://nanobase.org:8989"
    return  new OXServeSocket(url)   
}