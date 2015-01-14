#!/usr/bin/python3

#Wrote this very quick, but works anyway.

import os
from sys import argv

#this is the usage
usage = "usage:  python3 " + argv[0] + " [option]\n\nopts:   build\t\tto build the jcheetah file.\n\tbuild-docs\tto build the documentation."

if (len(argv) == 1):
	print(usage)
elif (argv[1] == "build"):
	
	#so this will be the document
	jcheetah = ""
	#we're opening the base file
	base = open(os.curdir + os.sep + "base" + os.sep + "base.js",'r')
	#we read it and write to the jcheetah file
	jcheetah += base.read()
	#we close the base file
	base.close()
	
	#so here we will write the includes to append to the header
	includes = "\n/**\n *  Includes:\n *  base.js"
	
	#per file in our module directory
	for path,dirs,files in os.walk(os.curdir + os.sep + "modules" + os.sep):
		#gonna get the file for that sub-directory
		for ifile in files:
			#if it's a javascript file
			if ifile.endswith(".js"):
				#we open it
				datafile = open(path + os.sep +  ifile)
				#add it to the includes
				includes += "\n *  " + ifile
				#read it and add its content to the jcheetah js
				jcheetah += datafile.read()
				#and close it
				datafile.close()
	
	#finishing the inlcudes
	includes += "\n */"
	
	#so now that we've added all the files it's time for the default "run after"
	#javascript, you can avoid this step if you want but you'd have to call
	#$.jCheetah.load() yourself in the document
	default = open(os.curdir + os.sep + "default" + os.sep + "jcheetah.js",'r')
	jcheetah += default.read()
	default.close()

	#we open a debug file (as debut it won't change anything) and write everything into it
	jc_debug = open('jcheetah.debug.js','w')
	jc_debug.write(jcheetah)
	jc_debug.close()
	
	# this is the header
	Header = """/**
 *  jCheetah
 *  Copyright (C) 2015 Edward González
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>
 */
"""
	#we add the header to the includes
	Header += includes
	
	#this is to avoid long comments
	avoid = False
	#and for the pharentesis to remove console.debug statments
	debug_phar_count = 0
	#so we open the file to write
	jc_normal = open('jcheetah.js','w')
	#write the header
	jc_normal.write(Header)
	
	#and for line in our jCheetah file
	for line in jcheetah.split("\n"):
		#we're going to check if this is a line to avoid but also
		#the end of the doc comment
		if avoid and line.find("*/") != -1:
			#and we remove the avoid
			avoid = False
			
		#otherwise if we're not avoiding
		elif not avoid:
			
			#check our line stripped
			lineStripped = line.strip();
			
			#if the line got a /** at the begginign and it doesn't end up there
			if lineStripped.find("/**") == 0 and lineStripped.find("*/") != len(lineStripped) - 2:
				#we are avoiding whatever next
				avoid = True
			
			#otherwise if this is a total comment
			elif lineStripped.find("//") == 0:
				#we're going to pass
				pass
			
			#otherwise if this is a debug message or we're into a debug message
			elif lineStripped.find("console.debug") == 0 or debug_phar_count != 0:
				
				#True when we're into a " quoted string
				strdouble = False
				#True when we're into a ' quoted string
				strsingle = False
				#True when we're escaped using the \ char
				escape = False
				
				#so for char in our line
				for char in lineStripped:
					
					#if we've escaped and are into a string, doesn't matter what char, we don't care
					if escape and (strdouble or strsingle):
						#and now we're out the escape
						escape = False
					#otherwise if we're into a string and our char is escape
					elif (strdouble or strsingle) and char == '\\':
						#we've escaped for the enxt char
						escape = True
					#if our char is " and we're into a " quoted string
					elif strdouble and char == '"':
						#we're out of the string
						strdouble = False
					#if our char is ' and we're into a ' quoted string
					elif strsingle and char == "'":
						#we're out of the string
						strsingle = False
					#otherwise if we're just in a string with any char
					elif strsingle or strdouble:
						#pass
						pass
					#now if we're not into a string and get this
					elif char == '"':
						strdouble = True
					elif char == "'":
						strsingle = True
					#and these add pharentesis and remove to the count so that
					#we know when we're out from the debug message
					elif char == "(":
						debug_phar_count += 1
					elif char == ")":
						debug_phar_count -= 1
						
			elif lineStripped:
				jc_normal.write(line + "\n")
	jc_normal.close()
elif (argv[1] == "build-docs"):
	os.chdir(os.curdir + os.sep + "docs" + os.sep)
	import docs
else:
	print(usage)