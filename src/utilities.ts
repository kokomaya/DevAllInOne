import * as fs from 'fs';
export function containsBothSubstrings(str: string, substr1: string, substr2: string): boolean {  
    return str.includes(substr1) && str.includes(substr2);  
} 

export function pathExists(p: string): boolean {
    try {
        fs.accessSync(p);
    } catch (err) {
        return false;
    }

    return true;
}