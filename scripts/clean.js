const compare = require('dpkg-compare-versions');
const fs = require('fs');
const path = require('path');

const BASE_PATH = path.normalize(
    path.join(__dirname, '..')
);
const REPO_ROOT = path.join(BASE_PATH, 'repo');

const PACKAGES_PATH = path.join(REPO_ROOT, 'Packages');
if(!fs.existsSync(PACKAGES_PATH))
{
	process.exit();
}

const PackagesText = fs.readFileSync(
	PACKAGES_PATH
).toString().trim();

if(!PackagesText)
{
	process.exit();
}

const debs = {};
const Packages = PackagesText.split(/\n{2}(?=Package:)/);
Packages.forEach(text=>{
	const data = get_data(text);

	const oldname = path.join(REPO_ROOT, data['Filename']);
	const pkgname = `${data['Package']}_${data['Version']}_${data['Architecture']}`;
	const file = `debs/${encodeURI(pkgname)}.deb`;
	data['Filename'] = file;

	
	
	
	if(fs.existsSync(oldname))
	{
		fs.renameSync(oldname, path.join(REPO_ROOT, file));
	}

	

	let pkg_entry_text = Object.entries(data).map(item=>item.join(': ')).join('\n');
	let id = `${data['Architecture']}-${data['Package']}`;
	if(id in debs)
	{
		let oldv = debs[id]['version'];
		let vcomp = compare(data['Version'], oldv);

		if(vcomp == 0){
			return;
		}
		else if(vcomp > 0)
		{
			delete_file(debs[id]['file']);
			set_debs(id, data['Version'], file, pkg_entry_text);
		}
		else {
			delete_file(file);
		}
	}
	else {
		set_debs(id, data['Version'], file, pkg_entry_text);
	}
})



fs.writeFileSync(PACKAGES_PATH, Object.values(debs).map(item=>item.text).join('\n\n'));


// Functions
function delete_file(file)
{
	let delete_path = path.join(REPO_ROOT, file);

	if(fs.existsSync(delete_path))
	{
		fs.unlinkSync(delete_path);
	}
}
function set_debs(id, version, file, text)
{
	debs[id] = {
		file,
		version,
		text
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