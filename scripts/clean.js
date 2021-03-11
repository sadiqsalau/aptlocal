const compare = require('dpkg-compare-versions');
const fs = require('fs');
const path = require('path');


//PATHS
const BASE_PATH = path.normalize(
    path.join(__dirname, '..')
);
const REPO_ROOT = path.join(BASE_PATH, 'repo');
const DEL_PATH = path.join(REPO_ROOT, 'deleted');

const PACKAGES_PATH = path.join(REPO_ROOT, 'Packages');


if(!fs.existsSync(PACKAGES_PATH))
{
	process.exit();
}

const Packages = fs.readFileSync(
	PACKAGES_PATH
).toString().trim().split(/\n{2}(?=Package:)/);


const debs = {};


Packages.forEach(text=>{
	const data = get_data(text);
	
	const oldname = path.join(REPO_ROOT, data['Filename']);
	
	const pkgname = `${data['Package']}_${data['Architecture']}`;
	const pkgfilename = `${data['Package']}_${data['Version']}_${data['Architecture']}`;
	
	const file = `debs/${encodeURIComponent(pkgfilename)}.deb`;
	
	
	
	data['Filename'] = file;

	
	
	
	if(fs.existsSync(oldname))
	{
		fs.renameSync(oldname, path.join(REPO_ROOT, file));
	}
	
	else {
	    return;
	}

	

	let pkg_entry_text = Object.entries(data).map(item=>item.join(': ')).join('\n');
	
	if(pkgname in debs)
	{
		const old_version = debs[pkgname]['Version'];
		const new_version = data['Version'];
		const vcomp = compare(new_version, old_version);
				
		if(vcomp == 0){
			return;
		}
		else if(vcomp > 0)
		{
			delete_file(pkgname, old_version, new_version, debs[pkgname]['Filename']);
			set_debs(pkgname, new_version, file, pkg_entry_text);
		}
		else {
			delete_file(pkgname, new_version, old_version, file);
		}
	}
	else {
		set_debs(pkgname, data['Version'], file, pkg_entry_text);
	}
})



fs.writeFileSync(PACKAGES_PATH, Object.values(debs).map(item=>item.Text).join('\n\n'));









// Functions
function delete_file(pkgname, old_version, new_version, file)
{
    console.log(">>>>>>>>>");
	console.log(`Removing: ${pkgname} :: ${old_version} < ${new_version}`);	
	
	let file_path = path.join(REPO_ROOT, file);
    let move_path = path.join(DEL_PATH, path.basename(file));
    
    
	if(fs.existsSync(file_path))
	{
		fs.renameSync(file_path, move_path);
	}
}



function set_debs(id, version, file, text)
{
	debs[id] = {
		Filename: file,
		Version: version,
		Text: text
	}
}




function get_data(text)
{
	text = text.split(/\n(?!\s)/gm);
	
	let data = text.map(
		item=>{
			let index = item.indexOf(':');
			let title = item.substring(0, index);
			let value = item.substring(++index).trim();

			return [title, value];
		}
	);

	return Object.fromEntries(data);
}
