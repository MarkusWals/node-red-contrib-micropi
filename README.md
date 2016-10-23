#MicroPi

A set of nodes for recording and streaming audio from an usb microphone connected to a Raspberry Pi in Node-Red.

Demo Flow:

https://flows.nodered.org/flow/2267b12494608d62037e2f8043b955ae


#Nodes:

##MicroPi

To record send boolean true as msg.payload, to stop send false.

3 Outputs:

1. Streaming audio as raw L16
2. Wav file as a buffer with metadata
3. Status messages

##Microphone

Streams Audio as raw L16 from the microphone. To record send boolean true as msg.payload, to stop send false.


##Wav-Filewriter

Pipes the audio stream into a wav file on the sdcard
    


###Important Notice!! 

MicroPi Requires to have NodeJS version > 6.5.x and Node-Red version > 0.14.x installed, note that those available via apt-get WILL NOT WORK.

For information on how to get the newest versions the easiest way just check http://thisdavej.com/beginners-guide-to-installing-node-js
 
Tested and working on: npm 3.10.3, node v6.5.0, node-red v0.14.6

