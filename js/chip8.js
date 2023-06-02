

const chip8 = function() {
  const cnv = document.getElementById('cnv')

  
  this.ctx = cnv.getContext('2d')
  this.pixelSize = 10
  this.width = 64 * this.pixelSize
  this.height = 32 * this.pixelSize

  cnv.width = this.width
  cnv.height = this.height

  this.count = 0

  this.init()
}


chip8.prototype.init = function() {
  this.memory = [4096]
  this.register = [16]
  this.stack = [16]
  this.index = null
  this.display = new Array(64 *32)
  this.displayFlag = false
  this.step = 0
  
  this.pc = 0x200   // contador de programa
  this.sp = null    // stack pointer

  // timers
  this.delayTimer = 0
  this.soundTimer = 0

  this.opcode = null

  this.keys = []
  this.keyMap = {
    49: 0x1,  // 1
    50: 0x2,  // 2
    51: 0x3,  // 3
    52: 0x4,  // 4
    81: 0x5,  // Q
    87: 0x6,  // W
    69: 0x7,  // E
    82: 0x8,  // R
    65: 0x9,  // A
    83: 0xA,  // S
    68: 0xB,  // D
    70: 0xC,  // F
    90: 0xD,  // Z
    88: 0xE,  // X
    67: 0xF,  // C
    86: 0x10  // V
  }

  this.currentKey = false

  const fonts= [ 
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
  ]



  for(let i in fonts){
    this.memory[i] = fonts[i]
  }


}



chip8.prototype.loadRom = function(rom) {
  for(let i = 0; i < rom.length; i++){
    this.memory[0x200 + i] = rom[i]
  }

  for(let i in this.display){
    this.display[i] = 0
  }
  this.displayFlag = true

  this.cycle()
}


chip8.prototype.cycle = function(){
  this.opCode()


  this.step++
  if(this.step % 2){
    if(this.delayTimer > 0){
      this.delayTimer--
    }
  }



  // draw in the screen
  if(this.displayFlag){
    for(let i in this.display){
      let x = (i % 64)
      let y = Math.floor(i / 64)

      if(this.display[i] == 1){
        this.ctx.fillStyle = '#000'
        this.ctx.fillRect(
          x * this.pixelSize,
          y * this.pixelSize,
          this.pixelSize,
          this.pixelSize
        )
      }else{
        this.ctx.fillStyle = '#036145'
        this.ctx.fillRect(
          x * this.pixelSize,
          y * this.pixelSize,
          this.pixelSize,
          this.pixelSize
        )
      }
    }

    this.displayFlag = false
  }


  setTimeout(this.cycle.bind(this),1)

 
  // requestAnimationFrame(this.cycle.bind(this))


}

chip8.prototype.opCode = function() {

  let opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1]
  let vx = (opcode & 0x0f00) >> 8
  let vy = (opcode & 0x00f0) >> 4

  this.pc += 2

  // this.debug(this.pc, opcode, vx, vy)
  switch(opcode & 0xf000){
    case 0x0000:
      switch(opcode & 0x00ff){
        case 0x00e0:
          // clear display
          for(let i in this.display){
            this.display[i] = 0
          }
          this.displayFlag = true
          break

        case 0x00ee:
          this.pc = this.stack[this.sp]
          this.sp--
          break
      }
      break

    case 0x1000:
      // Jump to location nnn.
      this.pc = opcode & 0x0fff
      break

    case 0x2000:
      // Call subroutine at nnn.
      this.sp++
      this.stack[this.sp] = this.pc
      this.pc = opcode & 0x0fff
      break
    case 0x3000:
      // Skip next instruction if Vx = kk.
      if(this.register[vx] == (opcode & 0x00ff)){
        this.pc += 2
      }
      break
    
    case 0x4000:
      // Skip next instruction if Vx != kk.
      if(this.register[vx] !== (opcode & 0x00ff)){
        this.pc += 2
      }
      break

    case 0x5000:
      // Skip next instruction if Vx = Vy.
      if(this.register[vx] == this.register[vy]){
        this.pc += 2
      }
      break
    
    case 0x6000:
      // Set Vx = kk.
      this.register[vx] = opcode & 0x00ff
      break
    case 0x7000:
      // Set Vx = Vx + kk.
      this.register[vx] += opcode & 0x00ff
      if(this.register[vx] > 255){
        this.register[vx] -= 256
      }
      break
    
    case 0x8000:
      switch(opcode & 0x000f){
        case 0x0000:
          // Set Vx = Vy.
          this.register[vx] = this.register[vy]
          break

        case 0x0001:
          // Set Vx = Vx OR Vy.
          this.register[vx] |= this.register[vy]
          break
        
        case 0x0002:
          // Set Vx = Vx AND Vy.
          this.register[vx] &= this.register[vy]
          break

        case 0x0003:
          // Set Vx = Vx XOR Vy.
          this.register[vx] ^= this.register[vy]
          break

        case 0x0004:
          // Set Vx = Vx + Vy, set VF = carry.
          this.register[vx] += this.register[vy]
          if(this.register[vx] > 255){
            this.register[0xf] = 1
            this.register[vx] -= 256
          }else{
            this.register[0xf] = 0
          }

          // if(this.register[vx] > 255){
          //   this.register[vx] -= 256
          // }
          break
        
        case 0x0005:
          // Set Vx = Vx - Vy, set VF = NOT borrow.
          if(this.register[vx] > this.register[vy]){
            this.register[0xf] = 1
          }else{
            this.register[0xf] = 0
          }

          this.register[vx] -= this.register[vy]
          if(this.register[vx] < 0){
            this.register[vx] += 256
          }
          break

        case 0x0006:
          // Set Vx = Vx SHR 1.
          this.register[0xf] = this.register[vx] & 0x1
          this.register[vx] >>= 1
          break

        case 0x0007:
          // Set Vx = Vy - Vx, set VF = NOT borrow.

          if(this.register[vy] > this.register[vx]){
            this.register[0xf] = 1
          }else{
            this.register[0xf] = 0
          }
          this.register[vx] = this.register[vy] - this.register[vx]
          if(this.register[vx] < 0){
            this.register[vx] += 256
          }

          break

        case 0x000e:
          // Set Vx = Vx SHL 1.
          this.register[0xf] = +(this.register[vx] & 0x80)
          this.register[vx] <<= 1
          if(this.register[vx] > 255){
            this.register[vx] -= 256
          }
          break

      }
      break

    case 0x9000:
      // Skip next instruction if Vx != Vy.
      if(this.register[vx] != this.register[vy]){
        this.pc += 2
      }
      break

    case 0xa000:
      // Set I = nnn.
      this.index = opcode & 0x0fff
      break

    case 0xb000:
      // Jump to location nnn + V0.
      this.pc = (opcode & 0x0fff) + this.register[0]
      break

    case 0xc000:
      // Set Vx = random byte AND kk.
      this.register[vx] = Math.floor(Math.random() * 255) & ( opcode & 0x00ff)
      break

    case 0xd000:
      // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.

      let height = opcode & 0x000f
      let rx = this.register[vx]
      let ry = this.register[vy]

      this.register[0xf] = 0


      for(let i = 0; i < height; i++){
        let currentPixel = this.memory[this.index + i]
        for(let c = 0; c < 8; c++){

          if(currentPixel & 0x80){
            let x = rx + c
            let y = ry + i

            if(x >= 64){ x -= 64}
            if(x < 0){ x += 64}
            if( y >= 32){ y -= 32}
            if(y < 0){ y += 32}

            if(this.display[y * 64 + x] == 1){
              this.register[0xf] = 1
            }

            this.display[y * 64 + x] ^= 1

          }

          currentPixel <<= 1
        }
      }

      this.displayFlag = true
      break

      case 0xe000:
        switch(opcode & 0x00ff){
          case 0x0099:
            // Skip next instruction if key with the value of Vx is pressed.
            if(this.keys[this.register[vx]]){
              this.pc += 2
            }
            break

          case 0x00a1:
            // Skip next instruction if key with the value of Vx is not pressed.
            if(!this.keys[this.register[vx]]){
              this.pc += 2
            }
            break
        }

        break

      case 0xf000:
        switch(opcode & 0x00ff){
          case 0x0007:
            // Set Vx = delay timer value.
            this.register[vx] = this.delayTimer
            break
          
          case 0x000a:
            // Wait for a key press, store the value of the key in Vx.
            if(!this.currentKey){
              return
            }else{
              this.register[vx] = this.currentKey
            }
            break

          case 0x0015:
            // Set delay timer = Vx.
            this.delayTimer = this.register[vx]
            break

          case 0x0018:
            // Set sound timer = Vx.
            this.soundTimer = this.register[vx]
            break

          case 0x001e:
            // Set I = I + Vx.
            this.index += this.register[vx]
            break

          case 0x0029:
            // Set I = location of sprite for digit Vx.
            this.index = this.register[vx] * 5
            break

          case 0x0033:
            // Store BCD representation of Vx in memory locations I, I+1, and I+2.
            let number = this.register[vx]
            for(let i = 3; i > 0;i--){
              this.memory[this.index + i -1] = parseInt(number % 10)
              number /= 10
            }
            break

          case 0x0055:
            // Store registers V0 through Vx in memory starting at location I.
            for(let i = 0; i <= vx; i++){
              this.memory[this.index + i] = this.register[i]
            }
            break

          case 0x0065:
            // Read registers V0 through Vx from memory starting at location I.
            for(let i = 0; i <= vx; i++){
              this.register[i] = this.memory[this.index + i] 
            }
            break
        }
        break





  }



}


chip8.prototype.debug = function(pc, opcode, vx, vy){
  if(this.count < 200){

    console.log(`Addr: ${pc-2}, opcode: 0x${hex(opcode)}`)
    switch(opcode & 0xf000){
      case 0x0000:
        switch(opcode & 0x00ff){
          case 0x00e0:
            console.log('clear screen\n\n')
            break
          case 0x00ee:
            console.log(`return from subruntine to addr ${this.stack[this.sp]}\n\n`)
            break
        }
        break
  
      
      case 0x1000:
        console.log(`jump to location 0x${hex(opcode & 0x0fff)}`)
        break
      
      case 0x2000:
        break
      
      case 0x3000:
        console.log(`register v${vx} == 0x${hex(opcode & 0x00ff)}`)
        break

      case 0x4000:
        console.log(`register v${vx} == 0x${hex(opcode & 0x00ff)}`)
        break

      case 0x5000:
        console.log(`register v${vx} == 0x${hex(opcode & 0x00ff)}`)
        break

      case 0x6000:
        console.log(`set register v${vx} to 0x${hex(opcode & 0x00ff)}\n\n`)
        break

      case 0x7000:
        console.log(`set register v${vx} += 0x${hex(opcode & 0x00ff)}\n\n`)
        break

      case 0x8000:
        switch(opcode & 0x000f){
          case 0x0000:
            console.log(`set register v${vx} to v${vy}`)
            break
        
          case 0x0001:
            console.log(`set register v${vx} to v${vy}`)
            break

          case 0x0002:
            console.log(`set register v${vx} to v${vy}`)
            break

          case 0x0003:
            console.log(`set register v${vx} to v${vy}`)
            break

          case 0x0004:
            console.log(`set register v${vx} to v${vy}`)
            break

          case 0x0004:
            console.log(`set register v${vx} to v${vy}`)
            break

        }
        break

      case 0xa000:
        console.log(`Set index to NNN 0x${hex(opcode & 0x0fff)}\n\n`)
        break

      case 0xc000:
        console.log(`Set register v${vx} to 0x${hex(Math.floor(Math.random() * 255) & ( opcode & 0x00ff))}\n\n`)
        break

      case 0xd000:
        console.log(`Draw \n\n`)
        break

      case 0xf000:
        switch(opcode & 0x00ff){
          case 0x0007:
            console.log(`set register v${vx} to ${this.delayTimer}`)
            break

          case 0x000a:
            console.log(`wait for a key pressed`)
            break

          case 0x0015:
            console.log(`set delay time to ${vx}`)
            break

          case 0x001e:
            console.log(`index += ${vx}`)
            break

          case 0x0029:
            console.log(`index = ${vx * 5}`)
            break

          case 0x0033:
            console.log(`0x0033`)
            break
        }
        break

      default:
        // console.log('Unimplemented OPcode')
        break
    }

    this.count++
  }
}


function hex(num){
  return num.toString(16)
}


