//判断是否是虚拟机环境

import { viewProcessMessage } from './process.js'
const childProcess = require('child_process')
const exec = childProcess.exec

//虚拟机进程的名称列表
const blackProcessList = ['vmtoolsd.exe', 'vmacthlp.exe', 'vmwaretray.exe', 'vmwareuser.exe', 'vboxservice.exe', 'vboxstray.exe', 'vmsrvc.exe', 'vmusrvc.exe', 'vpcmap.exe']
//虚拟机硬盘名称列表
const blackDiskList = ['vmware', 'vbox', 'virtual']
//虚拟机在注册表中的键值列表
const vmRegKeys = ["HKEY_LOCAL_MACHINE\SOFTWARE\Clients\StartMenuInternet\VMWAREHOSTOPEN.EXE", "HKEY_LOCAL_MACHINE\SOFTWARE\VMware, Inc.\VMware Tools", "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\VirtualDeviceDrivers", "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Enum\SCSI\Disk&Ven_VMware_&Prod_VMware_Virtual_S"]
//虚拟机的MAC地址中标识列表
const vmMACId = ['00-05-69', '00-1C-14', '00-0C-29', '00:50-56']

/**
 * 判断当前是否在虚拟机环境下
 */
export const isVm = function() {
	if(isExitProcessName() && checkVMByDiskName() && checkMACAddress() && checkRegisterOpenKey()) {
		return true
	}
	return false
}

/**
 * 通过进程名称判断
 */
function isExitProcessName() {
	//获取当前所有进程名称
	let processList = viewProcessMessage()
	
	let flag = true
	//遍历两个数组 找出虚拟机的进程 并关闭虚拟机进程
	for(let i=0;i<processList.length;i++) {
		if(blackProcessList.indexOf(processList[i][0]) != -1) {
			console.log('存在虚拟机')
			flag = false
			return false
		}
	}
	if(flag) {
		console.log('不存在虚拟机')
	}
	return true
}

/**
 * 基于硬盘驱动器名称检测
 */
function checkVMByDiskName() {
	//检查硬盘名称的命令
	 let cmd = 'wmic logicaldisk get caption'
	 
	 exec(cmd, (err, stdout, stderr) => {
		 if(err) {
			 console.error(err)
		 } else {
			 stdout.split('\n').filter((line) => {
			 	if(blackDiskList.indexOf(line) != -1) {
					console.log('检测到硬盘名称')
					return false
				}
			 })
		 }
	 })
	 return true
}

/**
 * 基于注册表键检测
 */
function checkRegisterOpenKey() {
	//检查硬盘名称的命令
	 let cmd1 = 'REG query HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\StartMenuInternet'
	 let cmd2 = 'REG query HKEY_LOCAL_MACHINE\\SOFTWARE\\VMware, Inc.'
	 let cmd3 = 'REG query HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control'
	 let cmd4 = 'REG query HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Enum\\SCSI'
	 
	 exec(cmd1, (err, stdout, stderr) => {
		 if(err) {
			 console.error(err)
		 } else {
			 stdout.split('\n').filter((line) => {
				 if(line == vmRegKeys[0]) {
					 return false
				 }
			 })
		 }
	 })
	 
	 /* exec(cmd2, (err, stdout, stderr) => {
	 		 if(err) {
	 			 console.error(err)
	 		 } else {
	 			 stdout.split('\n').filter((line) => {
	 				 if(line == vmRegKeys[1]) {
						 return false
					 }
	 			 })
	 		 }
	 }) */
	 
	 exec(cmd3, (err, stdout, stderr) => {
	 		 if(err) {
	 			 console.error(err)
	 		 } else {
	 			 stdout.split('\n').filter((line) => {
	 				 if(line == vmRegKeys[2]) {
						 return false
					 }
	 			 })
	 		 }
	 })
	 
	 exec(cmd4, (err, stdout, stderr) => {
	 		 if(err) {
	 			 console.error(err)
	 		 } else {
	 			 stdout.split('\n').filter((line) => {
	 				 if(line == vmRegKeys[3]) {
						 return false
					 }
	 			 })
	 		 }
	 })
	 return true
}

/**
 * 通过获取MAC地址来检测是否在虚拟机环境中
 * 技术方案：首先检测主机已知目标主机的IP地址，获取目标主机的MAC地址，将MAC地址发送给检测主机
 * 检测主机收到目标主机的MAC地址后，提取MAC地址中生产厂商的标识符
 * 标识符中与虚拟机MAC标识符列表中相匹配的代表运行在虚拟机中
 */
function checkMACAddress() {
	let cmd = 'ipconfig /all'
	
	exec(cmd, (err, stdout, stderr) => {
			 if(err) {
				 console.error(err)
			 } else {
				 let mac = ''
				 stdout.split('\n').filter((line) => {
					 for(let item of vmMACId) {
						 if(line.indexOf(item) != -1) {
							 //说明有虚拟机的MAC地址
							 return false
						 }
					 }
					 //获取mac地址
					 /* if(line.indexOf('物理地址') != -1|| line.indexOf('Physical Address') != -1) {
						 console.log('get!')
						 mac = line.replace('物理地址', '')
						 mac = line.replace('Physical Address', '')
					 } */
				 })
				// console.log(mac)
			 }
	})
	return true
}