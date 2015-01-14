/**
 *  jCheetah mysql udf JSON/CSV
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

#include <stdio.h>
#include <mysql.h>
#include <stdlib.h>
#include <string.h>
#include <my_global.h>
#include <my_sys.h>

#ifdef __WIN__
typedef unsigned __int64 ulonglong;
typedef __int64 longlong;
/* Microsofts 64 bit types */
#else
typedef unsigned long long ulonglong;
typedef long long longlong;
#endif /*__WIN__*/

struct current_pos {
    unsigned int pos;
    unsigned long char_pos;
};

extern "C"
my_bool json_init(UDF_INIT* initid, UDF_ARGS* args, char* message ){

    //This can't be null... if there are zero rows to parse
    //The result would be an empty array "[]"
    initid->maybe_null = 0;

    //We're allocating two chars [ and the null terminator
    char *data = (char*) malloc(sizeof(char)*2);

    if (data == NULL) {
        strcpy(message,"not enough memory");
        return 1;
    }

    //We set the char* to "[" an empty JSON array
    strcpy(data,"[");

    //And set the pointer to it
    initid->ptr = data;

    return 0;
}

extern "C"
void json_deinit(UDF_INIT* initid){

    //We're freeing the memory for the pointer
    free(initid->ptr);

}

extern "C"
void json_clear(UDF_INIT* initid, char* is_null, char *error ){

    //If there are more groups we must clear the pointer
    free(initid->ptr);

    //Set the data same as the init
    char *data = (char*) malloc(sizeof(char)*2);

    //if the data is null
    if (data == NULL) {
        //We've got an error
        error = (char*) 1;
        return;
    }

    //We copy the same empty set
    strcpy(data,"[");
    //And set it to the pointer
    initid->ptr = data;

}

extern "C"
void json_add(UDF_INIT* initid, UDF_ARGS* args, char* is_null, char *error){

    //The position
    current_pos *cpos = (current_pos*) malloc(sizeof(current_pos));
    //And also an array buffer, the buffer is used in arguments and contains the
    //parsed char* of the given integer or real item, allocating 50 chars per
    //argument 1 for the null terminator
    char *buff = (char*) malloc((51)*sizeof(char));

    //We check that we actually got them allocated
    if (buff == NULL || cpos == NULL) {
        error = (char*) 1;
        return;
    }

    unsigned int argcount = args->arg_count;
    unsigned long *arglens = args->lengths;

    //if we only got [
    if (strlen(initid->ptr) == 1) {
        initid->ptr = (char*) realloc(initid->ptr,strlen(initid->ptr) + 2);
        if (initid->ptr == NULL) {
            error = (char*) 1;
            return;
        }
        strcat(initid->ptr,"{");
    } else {
        initid->ptr = (char*) realloc(initid->ptr,strlen(initid->ptr) + 3);
        if (initid->ptr == NULL) {
            error = (char*) 1;
            return;
        }
        strcat(initid->ptr,",{");
    }

    for (cpos->pos = 0;cpos->pos < argcount;cpos->pos++) {

        initid->ptr = (char*) realloc(initid->ptr,
                       strlen(initid->ptr) + strlen(args->attributes[cpos->pos]) + 4);

        if (initid->ptr == NULL) {
            error = (char*) 1;
            return;
        }

        strcat(initid->ptr,"\"");
        strcat(initid->ptr,args->attributes[cpos->pos]);
        strcat(initid->ptr,"\":");

        //So if we've got a number
        if (args->arg_type[cpos->pos] == INT_RESULT ||
                args->arg_type[cpos->pos] == REAL_RESULT) {

            //We check that the value is not null
            if (args->args[cpos->pos]) {

                //if is an integer
                if (args->arg_type[cpos->pos] == INT_RESULT) {
                    sprintf(buff,
                            (cpos->pos == argcount - 1) ? "%lld" : "%lld,",
                            *(longlong*)args->args[cpos->pos]);
                //Or a real
                } else {
                    sprintf(buff,
                            (cpos->pos == argcount - 1) ? "%f" : "%f,",
                            *(double*)args->args[cpos->pos]);
                }


            //otherwise if it's null
            } else {
                //Gotta print null
                sprintf(buff,(cpos->pos == args->arg_count - 1) ? "%s" : "%s,","null");
            }

            //So sum the len of the saved data
            initid->ptr = (char*) realloc(initid->ptr,
                          (strlen(initid->ptr) + strlen(buff) + 1)*sizeof(char));
            if (initid->ptr == NULL) {
                error = (char*) 1;
                return;
            }
            strcat(initid->ptr,buff);

        //otherwise
        } else if (args->args[cpos->pos]) {

            initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 2)*sizeof(char));
            if (initid->ptr == NULL) {
                error = (char*) 1;
                return;
            }
            strcat(initid->ptr,"\"");

            for (cpos->char_pos = 0;
                 cpos->char_pos < arglens[cpos->pos];
                 cpos->char_pos++) {

                switch(args->args[cpos->pos][cpos->char_pos]) {

                case '"':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\\"");
                    break;
                case '\\':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\\\");
                    break;
                case '\n':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\n");
                    break;
                case '\t':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\t");
                    break;
                case '\r':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\r");
                    break;
                default:
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 2)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr," ");
                    initid->ptr[strlen(initid->ptr) - 1] = args->args[cpos->pos][cpos->char_pos];
                    break;
                }

            }

            //if this is not the last argument
            if (cpos->pos != argcount - 1) {
                //We need a comma appart of the pointer
                initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                if (initid->ptr == NULL) {
                    error = (char*) 1;
                    return;
                }
                strcat(initid->ptr,"\",");
            } else {
                //Othewise we dont need it
                initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 2)*sizeof(char));
                if (initid->ptr == NULL) {
                    error = (char*) 1;
                    return;
                }
                strcat(initid->ptr,"\"");
            }
        } else {
            //Gotta print null
            sprintf(buff,(cpos->pos == args->arg_count - 1) ? "%s" : "%s,","null");
            //So sum the len of the saved data
            initid->ptr = (char*) realloc(initid->ptr,
                          (strlen(initid->ptr) + strlen(buff) + 1)*sizeof(char));
            if (initid->ptr == NULL) {
                error = (char*) 1;
                return;
            }
            strcat(initid->ptr,buff);
        }
    }

    initid->ptr = (char*) realloc(initid->ptr,strlen(initid->ptr) + 2);
    if (initid->ptr == NULL) {
        error = (char*) 1;
        return;
    }
    strcat(initid->ptr,"}");

}

extern "C"
char *json(UDF_INIT * initid, UDF_ARGS *args, char *result, unsigned long *length, char *is_null, char * error ){

    initid->ptr = (char*) realloc(initid->ptr,strlen(initid->ptr) + 2);
    if (initid->ptr == NULL) {
        error = (char*) 1;
        return NULL;
    }
    strcat(initid->ptr,"]");

    *length = strlen(initid->ptr);
    return initid->ptr;
}

extern "C"
my_bool csv_init(UDF_INIT* initid, UDF_ARGS* args, char* message ){
    //This can't be null... if there are zero rows to parse
    //The result would be an empty string
    initid->maybe_null = 0;

    //We're allocating 1 char, the null terminator
    char *data = (char*) malloc(sizeof(char));

    if (data == NULL) {
        strcpy(message,"not enough memory");
        return 1;
    }

    //We set the char* to "" an empty string
    strcpy(data,"");

    //And set the pointer to it
    initid->ptr = data;
    return 0;
}

extern "C"
void csv_deinit(UDF_INIT* initid){
    //We're freeing the memory for the pointer
    free(initid->ptr);
}

extern "C"
void csv_clear(UDF_INIT* initid, char* is_null, char *error ){
    //If there are more groups we must clear the pointer
    free(initid->ptr);

    //We're allocating 1 char, the null terminator
    char *data = (char*) malloc(sizeof(char));

    //if the data is null
    if (data == NULL) {
        //We've got an error
        error = (char*) 1;
        return;
    }

    //We set the char* to "" an empty string
    strcpy(data,"");

    //And set the pointer to it
    initid->ptr = data;
}

extern "C"
void csv_add(UDF_INIT* initid, UDF_ARGS* args, char* is_null, char *error){
    //The position
    current_pos *cpos = (current_pos*) malloc(sizeof(current_pos));
    //And also an array buffer, the buffer is used in arguments and contains the
    //parsed char* of the given integer or real item, allocating 50 chars per
    //argument 1 for the null terminator
    char *buff = (char*) malloc((51)*sizeof(char));

    //We check that we actually got them allocated
    if (buff == NULL || cpos == NULL) {
        error = (char*) 1;
        return;
    }

    //We count the arguments and the lenghts
    unsigned int argcount = args->arg_count;
    unsigned long *arglens = args->lengths;

    //if there's a previous row
    if (strlen(initid->ptr) > 0) {
        //we add space for a new one
        initid->ptr = (char*) realloc(initid->ptr,strlen(initid->ptr) + 2);
        if (initid->ptr == NULL) {
            error = (char*) 1;
            return;
        }
        strcat(initid->ptr,"\n");
    }

    //and we loop per arg
    for (cpos->pos = 0;cpos->pos < argcount;cpos->pos++) {

        //So if we've got a number
        if (args->arg_type[cpos->pos] == INT_RESULT ||
                args->arg_type[cpos->pos] == REAL_RESULT) {

            //We check that the value is not null
            if (args->args[cpos->pos]) {

                //if is an integer
                if (args->arg_type[cpos->pos] == INT_RESULT) {
                    sprintf(buff,
                            (cpos->pos == argcount - 1) ? "%lld" : "%lld,",
                            *(longlong*)args->args[cpos->pos]);
                //Or a real
                } else {
                    sprintf(buff,
                            (cpos->pos == argcount - 1) ? "%f" : "%f,",
                            *(double*)args->args[cpos->pos]);
                }


            //otherwise if it's null
            } else {
                //Gotta print null
                sprintf(buff,(cpos->pos == args->arg_count - 1) ? "%s" : "%s,","null");
            }

            //So sum the len of the saved data
            initid->ptr = (char*) realloc(initid->ptr,
                          (strlen(initid->ptr) + strlen(buff) + 1)*sizeof(char));
            if (initid->ptr == NULL) {
                error = (char*) 1;
                return;
            }
            strcat(initid->ptr,buff);

        //otherwise
        } else if (args->args[cpos->pos]) {

            initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 2)*sizeof(char));
            if (initid->ptr == NULL) {
                error = (char*) 1;
                return;
            }
            strcat(initid->ptr,"\"");

            for (cpos->char_pos = 0;
                 cpos->char_pos < arglens[cpos->pos];
                 cpos->char_pos++) {

                switch(args->args[cpos->pos][cpos->char_pos]) {

                case '"':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\\"");
                    break;
                case '\\':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\\\");
                    break;
                case '\n':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\n");
                    break;
                case '\t':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\t");
                    break;
                case '\r':
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr,"\\r");
                    break;
                default:
                    initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 2)*sizeof(char));
                    if (initid->ptr == NULL) {
                        error = (char*) 1;
                        return;
                    }
                    strcat(initid->ptr," ");
                    initid->ptr[strlen(initid->ptr) - 1] = args->args[cpos->pos][cpos->char_pos];
                    break;
                }

            }

            //if this is not the last argument
            if (cpos->pos != argcount - 1) {
                //We need a comma appart of the pointer
                initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 3)*sizeof(char));
                if (initid->ptr == NULL) {
                    error = (char*) 1;
                    return;
                }
                strcat(initid->ptr,"\",");
            } else {
                //Othewise we dont need it
                initid->ptr = (char*) realloc(initid->ptr,(strlen(initid->ptr) + 2)*sizeof(char));
                if (initid->ptr == NULL) {
                    error = (char*) 1;
                    return;
                }
                strcat(initid->ptr,"\"");
            }
        } else {
            //Gotta print null
            sprintf(buff,(cpos->pos == args->arg_count - 1) ? "%s" : "%s,","null");
            //So sum the len of the saved data
            initid->ptr = (char*) realloc(initid->ptr,
                          (strlen(initid->ptr) + strlen(buff) + 1)*sizeof(char));
            if (initid->ptr == NULL) {
                error = (char*) 1;
                return;
            }
            strcat(initid->ptr,buff);
        }
    }

}

extern "C"
char *csv(UDF_INIT * initid, UDF_ARGS *args, char *result, unsigned long *length, char *is_null, char * error ){
    *length = strlen(initid->ptr);
    return initid->ptr;
}
