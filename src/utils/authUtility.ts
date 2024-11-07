import * as bcrypt from "bcrypt";
export class authUtility {
    public async hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const saltRounds = 10;
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                    reject(err);
                } else {
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(hash);
                        }
                    });
                }
            });
        });
    }
}