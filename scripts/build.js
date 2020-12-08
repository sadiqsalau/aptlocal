const compare = require('./dpkg-compare');
const fs = require('fs');
const REPO_ROOT = '/usr/local/aptlocal/repo/';

const debs = {};
const Packages = fs.readFileSync(REPO_ROOT + 'Packages').toString().trim().split(/\n{2}/);
Packages.forEach(text=>{
	const data = get_data(text);
	const oldname = data['Filename'];
	const file = `debs/${encodeURI(`${data['Package']}_${data['Version']}_${data['Architecture']}`)}.deb`;
	data['Filename'] = file;

	text = Object.entries(data).map(item=>item.join(': ')).join('\n');

	if(fs.existsSync(REPO_ROOT + oldname)) fs.renameSync(REPO_ROOT + oldname, REPO_ROOT + file);

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
			if(fs.existsSync(REPO_ROOT + debs[id]['file'])) fs.unlinkSync(REPO_ROOT + debs[id]['file']);
			set_debs(id, data['Version'], file, text);
		}
		else {
			if(fs.existsSync(REPO_ROOT + file)) fs.unlinkSync(REPO_ROOT + file);
		}
	}
	else {
		set_debs(id, data['Version'], file, text);
	}
})



fs.writeFileSync(REPO_ROOT + 'Packages', Object.values(debs).map(item=>item.text).join('\n\n'));


// Functions
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
	let data = text.split(/\n(?! )/gm).map(
		item=>item.split(':',2).map(item=>item.trim())
	);

	return Object.fromEntries(data);
}