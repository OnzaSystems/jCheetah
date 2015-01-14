#!/usr/bin/python3
import os, re
from json import dumps

def replace_attr(mo):
    value = mo.group(0)
    return '<span %CLASSBLUE%>' + value + '</span>'

def replace_attr_val(mo):
    value = mo.group(0)
    symb = re.compile('\*|\+|\-|\=|/|&lt;|&gt;]')
    new_value = re.sub(symb,replace_tags_def_var_func_symb,value)
    return '<i %CLASSGREEN%>' + new_value + '</i>'

def replace_tags_def_var_func_symb(mo):
    value = mo.group(0)
    return '<b>' + value + '</b>'

def replace_others_escape(mo):
    value = mo.group(0)
    return '<i %CLASSRED%>' + value + '</i>'

def parseHTML(_str):
    rtr = _str.replace("&","&amp;").replace(">","&gt;").replace("<",
            "&lt;").replace("\n",
            "<br>")
    
    return(rtr)

def parseHTML_EXAMPLE(_str):
    rtr = _str.replace("&","&amp;").replace(">","&gt;").replace("<",
            "&lt;")
    
    attr = re.compile('\S+=')
    attrval = re.compile('"[\w \'\|\{\}\[\]\(\)\=\^\$\!\?\\\.\+\-\*°¬!@#~%&/ñ¿¡`:;,]*"|\'[\w "\|\{\}\[\]\(\)\=\^\$\!\?\\\.\+\-\*°¬!@#~%&/ñ¿¡`:;,]*\'')
    tagsopenclose = re.compile('&lt;|&gt;');
    defopenclose = re.compile('\(|\)|\[|\]|\{|\}');
    var = re.compile('var ')
    func = re.compile('function')
    others = re.compile('foreach|endforeach|if|endif')
    
    allstr = ""
    for xline in rtr.split("\n"):
        if (xline == ""):
             continue;
    
        new_str = re.sub(attr,replace_attr,xline)
        new_str = re.sub(attrval,replace_attr_val,new_str)
        new_str = re.sub(tagsopenclose,replace_tags_def_var_func_symb,new_str.replace("&lt;?php",'<b %CLASSBLUE%>&lt;?php</b>').replace("?&gt;",'<b %CLASSBLUE%>?&gt;</b>'))
        new_str = re.sub(defopenclose,replace_tags_def_var_func_symb,new_str)
        new_str = re.sub(var,replace_tags_def_var_func_symb,new_str)
        new_str = re.sub(func,replace_tags_def_var_func_symb,new_str)
        new_str = re.sub(others,replace_others_escape,new_str)
    
        new_str = new_str.replace("%CLASSBLUE%",'class="blue"').replace("%CLASSGREEN%",'class="green"').replace("%CLASSRED%",'class="red"').replace("\\","<span class=\"red\">\\</span>") + "<br>"
        allstr += new_str
    
    return(allstr)

jsonIndex = []

jcdocFiles = {'resources/general.jcdoc':'json'+ os.sep +'general.json',
	      'resources/about.jcdoc':'json'+ os.sep +'about.json'}
for path, dirs, files in os.walk(os.pardir + os.sep + 'modules' + os.sep):
    for ifile in files:
        if ifile.endswith('.jcdoc'):
            hashfile = '#' + ifile.replace('.jcdoc','')
            dirfile = ifile.replace('.jcdoc','.json')
                
            jsonIndex.append(hashfile)
            jcdocFiles[path + os.sep + ifile] = "json" + os.sep + dirfile
            
for ifile in jcdocFiles.keys():
    
    infunc = False
    func = ''
    inmeta = False
    meta = ''
    inattr = False
    attr = ''
    
    intoexample = False
    graphic = False
    example = ''
    
    fin = open(ifile,'r')
    fout = open(jcdocFiles[ifile],'w')
    dout = {}
    
    for line in fin.readlines():
        
        if (line.strip() != '' and not line.startswith('#') and not intoexample):
            if (line.startswith("@attribute")):
                inattr = True
                infunc=inmeta = False
                attr = line.replace("@attribute",'')[1:].replace("\n","")
                
                if (dout.get("attributes") is None):
                    dout["attributes"] = {}
                
                dout["attributes"][attr] = {}
                
            elif (line.startswith("@metaattribute")):
                inmeta = True
                infunc=inattr = False
                meta = line.replace("@metaattribute",'')[1:].replace("\n","")
                
                if (dout.get("meta-attributes") is None):
                    dout["meta-attributes"] = {}
                
                dout["meta-attributes"][meta] = {}
                
            elif (line.startswith("@function")):
                
                infunc = True
                inmeta=inattr = False
                
                func = line.replace("@function",'')[1:].replace("\n","")
                
                if (dout.get("functions") is None):
                    dout["functions"] = {}
                dout["functions"][func] = {}
                
            elif (line.startswith("@type")):
                if not inattr:
                    pass
                else:
                    types = line.replace("@type",'')[1:].replace("\n","")
                    dout["attributes"][attr]["type"] = types.split("|")
                    
            elif (line.startswith("@description")):
                
                descr = parseHTML(line.replace("@description",'')[1:]).replace("\n","").replace("jqapi",
                        "<a href=\"https://github.com/jqapi/jqapi\">jqapi</a>").replace("jqueryui api",
                        "<a href=\"http://api.jqueryui.com/\">jqueryui api</a>")
               
                if not inattr and not inmeta and not infunc:
                    pass
                elif inattr:
                    dout["attributes"][attr]["description"] = descr
                elif inmeta:
                    dout["meta-attributes"][meta]["description"] = descr
                else:
                    dout["functions"][func]["description"] = descr
                jcdocFiles[ifile]
            elif (line.startswith("@example") or line.startswith("@graphicexample")):
                
                intoexample = True
                if (line.startswith("@graphicexample")):
                    graphic = True
                else:
                    graphic = False
                example = line[line.find('{')+1:line.find('}')]
                
            elif (line.startswith("@args")):
                
                if not infunc:
                    pass
                else:
                    args = line.replace("@args",'')[1:].replace("\n","")
                    dout["functions"][func]["args"] = args.split(",")
                
            elif (line.startswith("@returns")):
                
                if not infunc:
                    pass
                else:
                    returns = line.replace("@returns",'')[1:].replace("\n","")
                    dout["functions"][func]["returns"] = returns
                
            elif (line.startswith("@module")):
                dout["module"] = line.replace("@module",'')[1:].replace("\n","")
                
            elif (line.startswith("@info")):
                dout["info"] = line.replace("@info",'')[1:].replace("\n","")
                
            elif (line.startswith("@content")):
                dout["content"] = line.replace("@content",'')[1:].replace("\n","")
                
            elif (line.startswith("@see")):
                dout["see"] = line.replace("@see",'')[1:].replace("\n","")
                
        elif (intoexample and line.startswith('{' + example + '}')):
            intoexample = False
            if graphic:
                if inmeta:
                    dout["meta-attributes"][meta]["examples"][example] = "<div class=\"gexample\">" + dout["meta-attributes"][meta]["examples"][example] + "</div><hr>" + parseHTML_EXAMPLE(dout["meta-attributes"][meta]["examples"][example])
                elif inattr:
                    dout["attributes"][attr]["examples"][example] = "<div class=\"gexample\">" + dout["attributes"][attr]["examples"][example] + "</div><hr>" + parseHTML_EXAMPLE(dout["attributes"][attr]["examples"][example])
                elif infunc:
                    dout["functions"][func]["examples"][example] = "<div class=\"gexample\">" + dout["functions"][func]["examples"][example] + "</div><hr>" + parseHTML_EXAMPLE(dout["functions"][func]["examples"][example])

        elif (not line.startswith('#') and inattr and intoexample):
            if (dout["attributes"][attr].get("examples") is None):
                dout["attributes"][attr]["examples"] = {}
                
            if (dout["attributes"][attr]["examples"].get(example) is None):
                dout["attributes"][attr]["examples"][example] = ''
                
            if not graphic:
                dout["attributes"][attr]["examples"][example] += parseHTML_EXAMPLE(line)
            else:
                dout["attributes"][attr]["examples"][example] += line
            
        elif (not line.startswith('#') and inmeta and intoexample):
            if (dout["meta-attributes"][meta].get("examples") is None):
                dout["meta-attributes"][meta]["examples"] = {}
                
            if (dout["meta-attributes"][meta]["examples"].get(example) is None):
                dout["meta-attributes"][meta]["examples"][example] = ''
                
            if not graphic:
                dout["meta-attributes"][meta]["examples"][example] += parseHTML_EXAMPLE(line)
            else:
                dout["meta-attributes"][meta]["examples"][example] += line
            
        elif (not line.startswith('#') and infunc and intoexample):
            if (dout["functions"][func].get("examples") is None):
                dout["functions"][func]["examples"] = {}
                
            if (dout["functions"][func]["examples"].get(example) is None):
                dout["functions"][func]["examples"][example] = ''
                
            if not graphic:
                dout["functions"][func]["examples"][example] += parseHTML_EXAMPLE(line)
            else:
                dout["functions"][func]["examples"][example] += line
            
    
    fout.write(dumps(dout,sort_keys=True))
    fin.close()
    fout.close()
 
fout = open("json" + os.sep + "index.json",'w')
jsonIndex.sort();
fout.write(dumps(jsonIndex,sort_keys=True))
fout.close()
