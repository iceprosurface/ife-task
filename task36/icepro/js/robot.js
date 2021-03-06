(function(square) {
    //该模块是下面所有模块的总类，定义一些常量和访问接口
    class robot {
        constructor(map) {
                var self = this;
                this.ROBOT_COMMAND = [
                    /^(go)\s*(\d*)$/i,
                    /^(tun)\s+(lef|rig|bac)$/i,
                    /^(tra)\s+(lef|top|bot|rig)\s*(\d*)$/i,
                    /^(mov)\s+(lef|top|bot|rig)\s*(\d*)$/i,
                    /^(build)$/i,
                    /^(bru)\s+[#](\d{6})$/i,
                    /^(mov)\s+(to)\s+(\d+)\s*[,]\s*(\d+)$/i
                ];
                // this.picture = pictureUrl;
                //perDelta代表每秒增量
                this.property = {
                    direction: {
                        //90 14*90= 
                        delta: 0,
                        value: 0,
                        perDelta: 1260
                    },
                    x: {
                        //1 9*1
                        delta: 0,
                        value: 0,
                        perDelta: 9
                    },
                    y: {
                        //1 9*1
                        delta: 0,
                        value: 0,
                        perDelta: 9
                    }
                };
                this.map = map;
            }
            /**
             *运行
             *@param array[code1,code2,……]
             *@return arr[fn1,fn2,fn3……]
             */
        run(codes, syntaxError) {
                if (!syntaxError) {
                    var arr = [];
                    var self = this;
                    for (var i in codes) {
                        //由于需要保留i所以这里需要闭包
                        //TODO：不确定是否会引起内存泄漏
                        (function(self) {
                            var exec = self.isInCommandList(codes[i]);
                            if (exec)
                                arr.push(function() {
                                    return self.invoke(exec);
                                });
                        })(self);
                    }
                    return arr;
                } else {
                    return false;
                }

            }
            //TODO：实现一个invoke接口
            //invoke接受详细的exec
            //列表顺序为 0-匹配字符串 1-匹配分项目1 ……
            //对应的参数为 0-总字符串 1-inject 2-param1 3-param2 ……
            /**
             *呼叫命令
             *@param exec array[mainString,inject,param1……]
             */
        invoke(exec) {
                if (exec.length >= 2) {
                    //解构参数
                    var [mainString, inject, ...x] = exec;
                    //第一个参数默认是匹配项
                    return this.command[inject](...x);
                }
                return false;
            }
            //判断是否在commandlist中，如果存在，返回对应的exec列表
            //不存在则返回exec
            /**
             *判断是否在commandlist
             *@param string 输入代码串
             *@return true: array[mainString,inject,param1……] false:false
             */
        isInCommandList(str) {
                for (let j in this.ROBOT_COMMAND) {
                    //输出顺序为 0-匹配字符串 1-匹配分项目1 ……
                    let arr = this.ROBOT_COMMAND[j].exec(str);
                    if (arr) {
                        let index = this.commandList.indexOf(arr[1]);
                        if (index > -1) {
                            return arr;
                        }
                    }
                }
                return false;
            }
            //command列表
        get command() {
            //指令的常量储存
            // GO：向蓝色边所面向的方向前进一格（一格等同于正方形的边长）
            // TUN LEF：向左转（逆时针旋转90度）
            // TUN RIG：向右转（顺时针旋转90度）
            // TUN BAC：向右转（旋转180度）

            var self = this;
            var map = this.map;
            //may use
            var fn_case = function(direction, callback1, callback2, callback3, callback4) {
                switch (direction) {
                    case 'lef':
                        callback1();
                        break;
                    case 'rig':
                        callback2();
                        break;
                    case 'top':
                        callback3();
                        break;
                    case 'bot':
                        callback4();
                        break;
                }
            };
            var where = function(num, mustReturn) {
                let x = self.property.x.value,
                    y = self.property.y.value,
                    result;
                switch (self.property.direction.value % 360) {
                    case 0:
                        result = ["y", -num];
                        if (mustReturn) return result;
                        if (!map.haveWall(x, y - num))
                            return false;
                        break;
                    case 90:
                        result = ["x", +num];
                        if (mustReturn) return result;
                        if (!map.haveWall(x + num, y))
                            return false;
                        break;
                    case 180:
                        result = ["y", +num];
                        if (mustReturn) return result;
                        if (!map.haveWall(x, y + num))
                            return false;
                        break;
                    case 270:
                        result = ["x", -num];
                        if (mustReturn) return result;
                        if (!map.haveWall(x - num, y))
                            return false;
                        break;
                }
                return result;
            };
            //command必须返回成功或者失败！
            //允许依次返回function数组，但每个function必须返回成功或者失败
            return {
                go: function(numS) {
                    let num = parseInt(numS === "" ? 1 : numS);
                    if (!where(num)) return false;
                    let [axle, value] = where(num);
                    self.property[axle].delta += value;
                    console.log('go has been called');
                    return true;
                },
                tun: function(direction) {
                    switch (direction) {
                        case 'lef':
                            self.property.direction.delta -= 90;
                            break;
                        case 'rig':
                            self.property.direction.delta += 90;
                            break;
                        case 'bac':
                            self.property.direction.delta += 180;
                            break;
                    }
                    console.log('tun has been called');
                    return true;
                },
                tra: function(direction, numS) {
                    let x = self.property.x.value,
                        y = self.property.y.value,
                        num = parseInt(numS === "" ? 1 : numS);
                    switch (direction) {
                        case 'lef':
                            if (map.haveWall(x - num, y))
                                self.property.x.delta -= num;
                            else
                                return false;
                            break;
                        case 'top':
                            if (map.haveWall(x, y - num))
                                self.property.y.delta -= num;
                            else
                                return false;
                            break;
                        case 'rig':
                            if (map.haveWall(x + num, y))
                                self.property.x.delta += num;
                            else
                                return false;
                            break;
                        case 'bot':
                            if (map.haveWall(x, y + num))
                                self.property.y.delta += num;
                            else
                                return false;
                            break;
                    }
                    console.log('tra has been called');
                    return true;
                },
                mov: function(direction, numS) {
                    if (arguments.length == 3) {
                        let x = parseInt(arguments[1]) - 1,
                            y = parseInt(arguments[2]) - 1;
                        var pos = map.findWay(self.property.x.value, self.property.y.value, x, y);
                        var result = [];
                        //递归取出信息
                        while (pos) {
                            if (pos.delatx === 0 && pos.delaty === 0) break;
                            if (pos.delatx !== 0) {
                                if (pos.delatx > 0) {
                                    result.push(function() {
                                        return self.invoke(["mov", "mov", "rig", ""]);
                                    });
                                } else {
                                    result.push(function() {
                                        return self.invoke(["mov", "mov", "lef", ""]);
                                    });
                                }
                            } else {
                                if (pos.delaty > 0) {
                                    result.push(function() {
                                        return self.invoke(["mov", "mov", "bot", ""]);
                                    });
                                } else {
                                    result.push(function() {
                                        return self.invoke(["mov", "mov", "top", ""]);
                                    });
                                }
                            }
                            pos = pos.posLast;
                        }
                        return result;
                    } else {
                        let num = parseInt(numS === "" ? 1 : numS);
                        switch (direction) {
                            case 'lef':
                                self.property.direction.delta = -self.property.direction.value + 270;
                                break;
                            case 'rig':
                                self.property.direction.delta = -self.property.direction.value + 90;
                                break;
                            case 'top':
                                self.property.direction.delta = -self.property.direction.value + 0;
                                break;
                            case 'bot':
                                self.property.direction.delta = -self.property.direction.value + 180;
                                break;
                        }
                        if (!self.command.tra(direction, numS)) return false;
                        return true;
                    }
                },
                build: function() {
                    //先找找看有没有墙，如果有墙则返回false
                    if (!where(1)) {
                        console.log("haveWall");
                        return false;
                    }
                    //解构where
                    let [axle, value] = where(1),
                        x,
                        y;
                    if (axle == "x") {
                        x = self.property.x.value + value;
                        y = self.property.y.value;
                    } else {
                        x = self.property.x.value;
                        y = self.property.y.value + value;
                    }
                    //看看有没有超界，超界直接跳出返回false
                    if (!map.beyondWord(x, y))
                        map.buildWall(x, y, "e3e3e3");
                    else
                        return false;
                    return true;

                },
                bru: function(color) {
                    //先找找看有没有墙，如果没有墙则返回false
                    if (where(1)) {
                        console.log("no Wall");
                        return false;
                    }
                    let [axle, value] = where(1, true),
                        x,
                        y;
                    if (axle == "x") {
                        x = self.property.x.value + value;
                        y = self.property.y.value;
                    } else {
                        x = self.property.x.value;
                        y = self.property.y.value + value;
                    }
                    //看看是否超界超界直接返回false
                    if (!map.beyondWord(x, y)) {
                        color = "000000" + color;
                        map.buildWall(x, y, color.substring(color.length - 6));
                    } else {
                        return false;
                    }
                    return true;

                }

            };
        }
        get commandList() {
                let list = [];
                for (let i in this.command) list.push(i);
                return list;
            }
            //TODO：test update
        update(time) {
            for (let i in this.property) {
                //结构参数
                let { delta, value, perDelta } = this.property[i];
                //当前剩余delta属性不为0则进行更新
                if (delta !== 0) {
                    //计算绝对值
                    if (Math.abs(delta) - perDelta * time > 0) {
                        //如果绝对值大于0，则说明剩余量大于当前时间的计算量
                        this.property[i].value += delta > 0 ? +perDelta * time : -perDelta * time;
                        this.property[i].delta += delta > 0 ? -perDelta * time : +perDelta * time;
                    } else {
                        //若小于0，则说明需要将delta归零，并减去剩余的delta
                        this.property[i].value += delta;
                        this.property[i].delta = 0;
                    }
                }
                // this.property[i] = {delta:delta, value:value , perDelta:perDelta};
            }
            //专门修正角度
            if (this.property.direction.value < 0) this.property.direction.value += 360;
            if (this.property.direction.value >= 360) this.property.direction.value -= 360;
        }
    }
    square.prototype.robot = robot;


})(square);