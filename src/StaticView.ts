export function getWebviewContent_ascii_lut(){
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extended ASCII Table</title>
    <script>
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'f') {
            // Notify the extension to trigger the VS Code find box
            vscode.postMessage({
                command: 'triggerFind'
            });
        }
    });
    </script>

    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            padding: 20px;
            background-color: #f4f4f4;
        }
        h2 {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            color: #222;
        }
        th {
            position: sticky;
            background: #333;
            color: white;
        }
        code {
            background: #eee;
            padding: 2px 5px;
            border-radius: 3px;
            color: #000;
        }
    </style>
</head>
<table>
	<caption>
		Standard ASCII table (decimal 0-31 shaded are control characters, the rest are printable characters)</caption>
    <thead>
		<tr>
			<th>
				Binary</th>
			<th>
				Octal</th>
			<th>
				Decimal</th>
			<th>
				Hex</th>
			<th>
				Char/Abbr</th>
			<th>
				Description</th>
		</tr>
    </thead>
	<tbody>
		<tr class="bg-ctrl">
			<td>
				00000000</td>
			<td>
				000</td>
			<td>
				0</td>
			<td>
				00</td>
			<td>
				NUL (NULL)</td>
			<td>
				Null character</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00000001</td>
			<td>
				001</td>
			<td>
				1</td>
			<td>
				01</td>
			<td>
				SOH (Start Of Headling)</td>
			<td>
				Start of heading</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00000010</td>
			<td>
				002</td>
			<td>
				2</td>
			<td>
				02</td>
			<td>
				STX (Start Of Text)</td>
			<td>
				Start of text</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00000011</td>
			<td>
				003</td>
			<td>
				3</td>
			<td>
				03</td>
			<td>
				ETX (End Of Text)</td>
			<td>
				End of text</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00000100</td>
			<td>
				004</td>
			<td>
				4</td>
			<td>
				04</td>
			<td>
				EOT (End Of Transmission)</td>
			<td>
				End of transmission</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00000101</td>
			<td>
				005</td>
			<td>
				5</td>
			<td>
				05</td>
			<td>
				ENQ (Enquiry)</td>
			<td>
				Enquiry</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00000110</td>
			<td>
				006</td>
			<td>
				6</td>
			<td>
				06</td>
			<td>
				ACK (Acknowledge)</td>
			<td>
				Acknowledge</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00000111</td>
			<td>
				007</td>
			<td>
				7</td>
			<td>
				07</td>
			<td>
				BEL (Bell)</td>
			<td>
				Bell</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001000</td>
			<td>
				010</td>
			<td>
				8</td>
			<td>
				08</td>
			<td>
				BS (Backspace)</td>
			<td>
				Backspace</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001001</td>
			<td>
				011</td>
			<td>
				9</td>
			<td>
				09</td>
			<td>
				HT (Horizontal Tab)</td>
			<td>
				Horizontal tab</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001010</td>
			<td>
				012</td>
			<td>
				10</td>
			<td>
				0A</td>
			<td>
				LF/NL(Line Feed/New Line)</td>
			<td>
				Line feed / new line</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001011</td>
			<td>
				013</td>
			<td>
				11</td>
			<td>
				0B</td>
			<td>
				VT (Vertical Tab)</td>
			<td>
				Vertical tab</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001100</td>
			<td>
				014</td>
			<td>
				12</td>
			<td>
				0C</td>
			<td>
				FF/NP (Form Feed/New Page)</td>
			<td>
				Form feed / new page</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001101</td>
			<td>
				015</td>
			<td>
				13</td>
			<td>
				0D</td>
			<td>
				CR (Carriage Return)</td>
			<td>
				Carriage return</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001110</td>
			<td>
				016</td>
			<td>
				14</td>
			<td>
				0E</td>
			<td>
				SO (Shift Out)</td>
			<td>
				Shift out</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00001111</td>
			<td>
				017</td>
			<td>
				15</td>
			<td>
				0F</td>
			<td>
				SI (Shift In)</td>
			<td>
				Shift in</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010000</td>
			<td>
				020</td>
			<td>
				16</td>
			<td>
				10</td>
			<td>
				DLE (Data Link Escape)</td>
			<td>
				Data link escape</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010001</td>
			<td>
				021</td>
			<td>
				17</td>
			<td>
				11</td>
			<td>
				DC1/XON<br>
				(Device Control 1/Transmission On)</td>
			<td>
				Device control 1 / XON</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010010</td>
			<td>
				022</td>
			<td>
				18</td>
			<td>
				12</td>
			<td>
				DC2 (Device Control 2)</td>
			<td>
				Device control 2</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010011</td>
			<td>
				023</td>
			<td>
				19</td>
			<td>
				13</td>
			<td>
				DC3/XOFF<br>
				(Device Control 3/Transmission Off)</td>
			<td>
				Device control 3 / XOFF</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010100</td>
			<td>
				024</td>
			<td>
				20</td>
			<td>
				14</td>
			<td>
				DC4 (Device Control 4)</td>
			<td>
				Device control 4</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010101</td>
			<td>
				025</td>
			<td>
				21</td>
			<td>
				15</td>
			<td>
				NAK (Negative Acknowledge)</td>
			<td>
				Negative acknowledge</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010110</td>
			<td>
				026</td>
			<td>
				22</td>
			<td>
				16</td>
			<td>
				SYN (Synchronous Idle)</td>
			<td>
				Synchronous idle</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00010111</td>
			<td>
				027</td>
			<td>
				23</td>
			<td>
				17</td>
			<td>
				ETB (End of Transmission Block)</td>
			<td>
				End of transmission block</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011000</td>
			<td>
				030</td>
			<td>
				24</td>
			<td>
				18</td>
			<td>
				CAN (Cancel)</td>
			<td>
				Cancel</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011001</td>
			<td>
				031</td>
			<td>
				25</td>
			<td>
				19</td>
			<td>
				EM (End of Medium)</td>
			<td>
				End of medium</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011010</td>
			<td>
				032</td>
			<td>
				26</td>
			<td>
				1A</td>
			<td>
				SUB (Substitute)</td>
			<td>
				Substitute</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011011</td>
			<td>
				033</td>
			<td>
				27</td>
			<td>
				1B</td>
			<td>
				ESC (Escape)</td>
			<td>
				Escape</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011100</td>
			<td>
				034</td>
			<td>
				28</td>
			<td>
				1C</td>
			<td>
				FS (File Separator)</td>
			<td>
				File separator</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011101</td>
			<td>
				035</td>
			<td>
				29</td>
			<td>
				1D</td>
			<td>
				GS (Group Separator)</td>
			<td>
				Group separator</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011110</td>
			<td>
				036</td>
			<td>
				30</td>
			<td>
				1E</td>
			<td>
				RS (Record Separator)</td>
			<td>
				Record separator</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				00011111</td>
			<td>
				037</td>
			<td>
				31</td>
			<td>
				1F</td>
			<td>
				US (Unit Separator)</td>
			<td>
				Unit separator</td>
		</tr>
		<tr>
			<td>
				00100000</td>
			<td>
				040</td>
			<td>
				32</td>
			<td>
				20</td>
			<td>
				(Space)</td>
			<td>
				Space</td>
		</tr>
		<tr>
			<td>
				00100001</td>
			<td>
				041</td>
			<td>
				33</td>
			<td>
				21</td>
			<td>
				!</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00100010</td>
			<td>
				042</td>
			<td>
				34</td>
			<td>
				22</td>
			<td>
				"</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00100011</td>
			<td>
				043</td>
			<td>
				35</td>
			<td>
				23</td>
			<td>
				#</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00100100</td>
			<td>
				044</td>
			<td>
				36</td>
			<td>
				24</td>
			<td>
				$</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00100101</td>
			<td>
				045</td>
			<td>
				37</td>
			<td>
				25</td>
			<td>
				%</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00100110</td>
			<td>
				046</td>
			<td>
				38</td>
			<td>
				26</td>
			<td>
				&amp;</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00100111</td>
			<td>
				047</td>
			<td>
				39</td>
			<td>
				27</td>
			<td>
				'</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101000</td>
			<td>
				050</td>
			<td>
				40</td>
			<td>
				28</td>
			<td>
				(</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101001</td>
			<td>
				051</td>
			<td>
				41</td>
			<td>
				29</td>
			<td>
				)</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101010</td>
			<td>
				052</td>
			<td>
				42</td>
			<td>
				2A</td>
			<td>
				*</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101011</td>
			<td>
				053</td>
			<td>
				43</td>
			<td>
				2B</td>
			<td>
				+</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101100</td>
			<td>
				054</td>
			<td>
				44</td>
			<td>
				2C</td>
			<td>
				,</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101101</td>
			<td>
				055</td>
			<td>
				45</td>
			<td>
				2D</td>
			<td>
				-</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101110</td>
			<td>
				056</td>
			<td>
				46</td>
			<td>
				2E</td>
			<td>
				.</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00101111</td>
			<td>
				057</td>
			<td>
				47</td>
			<td>
				2F</td>
			<td>
				/</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110000</td>
			<td>
				060</td>
			<td>
				48</td>
			<td>
				30</td>
			<td>
				0</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110001</td>
			<td>
				061</td>
			<td>
				49</td>
			<td>
				31</td>
			<td>
				1</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110010</td>
			<td>
				062</td>
			<td>
				50</td>
			<td>
				32</td>
			<td>
				2</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110011</td>
			<td>
				063</td>
			<td>
				51</td>
			<td>
				33</td>
			<td>
				3</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110100</td>
			<td>
				064</td>
			<td>
				52</td>
			<td>
				34</td>
			<td>
				4</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110101</td>
			<td>
				065</td>
			<td>
				53</td>
			<td>
				35</td>
			<td>
				5</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110110</td>
			<td>
				066</td>
			<td>
				54</td>
			<td>
				36</td>
			<td>
				6</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00110111</td>
			<td>
				067</td>
			<td>
				55</td>
			<td>
				37</td>
			<td>
				7</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111000</td>
			<td>
				070</td>
			<td>
				56</td>
			<td>
				38</td>
			<td>
				8</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111001</td>
			<td>
				071</td>
			<td>
				57</td>
			<td>
				39</td>
			<td>
				9</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111010</td>
			<td>
				072</td>
			<td>
				58</td>
			<td>
				3A</td>
			<td>
				:</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111011</td>
			<td>
				073</td>
			<td>
				59</td>
			<td>
				3B</td>
			<td>
				;</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111100</td>
			<td>
				074</td>
			<td>
				60</td>
			<td>
				3C</td>
			<td>
				&lt;</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111101</td>
			<td>
				075</td>
			<td>
				61</td>
			<td>
				3D</td>
			<td>
				=</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111110</td>
			<td>
				076</td>
			<td>
				62</td>
			<td>
				3E</td>
			<td>
				&gt;</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				00111111</td>
			<td>
				077</td>
			<td>
				63</td>
			<td>
				3F</td>
			<td>
				?</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000000</td>
			<td>
				100</td>
			<td>
				64</td>
			<td>
				40</td>
			<td>
				@</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000001</td>
			<td>
				101</td>
			<td>
				65</td>
			<td>
				41</td>
			<td>
				A</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000010</td>
			<td>
				102</td>
			<td>
				66</td>
			<td>
				42</td>
			<td>
				B</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000011</td>
			<td>
				103</td>
			<td>
				67</td>
			<td>
				43</td>
			<td>
				C</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000100</td>
			<td>
				104</td>
			<td>
				68</td>
			<td>
				44</td>
			<td>
				D</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000101</td>
			<td>
				105</td>
			<td>
				69</td>
			<td>
				45</td>
			<td>
				E</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000110</td>
			<td>
				106</td>
			<td>
				70</td>
			<td>
				46</td>
			<td>
				F</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01000111</td>
			<td>
				107</td>
			<td>
				71</td>
			<td>
				47</td>
			<td>
				G</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001000</td>
			<td>
				110</td>
			<td>
				72</td>
			<td>
				48</td>
			<td>
				H</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001001</td>
			<td>
				111</td>
			<td>
				73</td>
			<td>
				49</td>
			<td>
				I</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001010</td>
			<td>
				112</td>
			<td>
				74</td>
			<td>
				4A</td>
			<td>
				J</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001011</td>
			<td>
				113</td>
			<td>
				75</td>
			<td>
				4B</td>
			<td>
				K</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001100</td>
			<td>
				114</td>
			<td>
				76</td>
			<td>
				4C</td>
			<td>
				L</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001101</td>
			<td>
				115</td>
			<td>
				77</td>
			<td>
				4D</td>
			<td>
				M</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001110</td>
			<td>
				116</td>
			<td>
				78</td>
			<td>
				4E</td>
			<td>
				N</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01001111</td>
			<td>
				117</td>
			<td>
				79</td>
			<td>
				4F</td>
			<td>
				O</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010000</td>
			<td>
				120</td>
			<td>
				80</td>
			<td>
				50</td>
			<td>
				P</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010001</td>
			<td>
				121</td>
			<td>
				81</td>
			<td>
				51</td>
			<td>
				Q</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010010</td>
			<td>
				122</td>
			<td>
				82</td>
			<td>
				52</td>
			<td>
				R</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010011</td>
			<td>
				123</td>
			<td>
				83</td>
			<td>
				53</td>
			<td>
				S</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010100</td>
			<td>
				124</td>
			<td>
				84</td>
			<td>
				54</td>
			<td>
				T</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010101</td>
			<td>
				125</td>
			<td>
				85</td>
			<td>
				55</td>
			<td>
				U</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010110</td>
			<td>
				126</td>
			<td>
				86</td>
			<td>
				56</td>
			<td>
				V</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01010111</td>
			<td>
				127</td>
			<td>
				87</td>
			<td>
				57</td>
			<td>
				W</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011000</td>
			<td>
				130</td>
			<td>
				88</td>
			<td>
				58</td>
			<td>
				X</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011001</td>
			<td>
				131</td>
			<td>
				89</td>
			<td>
				59</td>
			<td>
				Y</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011010</td>
			<td>
				132</td>
			<td>
				90</td>
			<td>
				5A</td>
			<td>
				Z</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011011</td>
			<td>
				133</td>
			<td>
				91</td>
			<td>
				5B</td>
			<td>
				[</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011100</td>
			<td>
				134</td>
			<td>
				92</td>
			<td>
				5C</td>
			<td>
				\</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011101</td>
			<td>
				135</td>
			<td>
				93</td>
			<td>
				5D</td>
			<td>
				]</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011110</td>
			<td>
				136</td>
			<td>
				94</td>
			<td>
				5E</td>
			<td>
				^</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01011111</td>
			<td>
				137</td>
			<td>
				95</td>
			<td>
				5F</td>
			<td>
				_</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100000</td>
			<td>
				140</td>
			<td>
				96</td>
			<td>
				60</td>
			<td>
				</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100001</td>
			<td>
				141</td>
			<td>
				97</td>
			<td>
				61</td>
			<td>
				a</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100010</td>
			<td>
				142</td>
			<td>
				98</td>
			<td>
				62</td>
			<td>
				b</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100011</td>
			<td>
				143</td>
			<td>
				99</td>
			<td>
				63</td>
			<td>
				c</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100100</td>
			<td>
				144</td>
			<td>
				100</td>
			<td>
				64</td>
			<td>
				d</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100101</td>
			<td>
				145</td>
			<td>
				101</td>
			<td>
				65</td>
			<td>
				e</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100110</td>
			<td>
				146</td>
			<td>
				102</td>
			<td>
				66</td>
			<td>
				f</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01100111</td>
			<td>
				147</td>
			<td>
				103</td>
			<td>
				67</td>
			<td>
				g</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101000</td>
			<td>
				150</td>
			<td>
				104</td>
			<td>
				68</td>
			<td>
				h</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101001</td>
			<td>
				151</td>
			<td>
				105</td>
			<td>
				69</td>
			<td>
				i</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101010</td>
			<td>
				152</td>
			<td>
				106</td>
			<td>
				6A</td>
			<td>
				j</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101011</td>
			<td>
				153</td>
			<td>
				107</td>
			<td>
				6B</td>
			<td>
				k</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101100</td>
			<td>
				154</td>
			<td>
				108</td>
			<td>
				6C</td>
			<td>
				l</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101101</td>
			<td>
				155</td>
			<td>
				109</td>
			<td>
				6D</td>
			<td>
				m</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101110</td>
			<td>
				156</td>
			<td>
				110</td>
			<td>
				6E</td>
			<td>
				n</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01101111</td>
			<td>
				157</td>
			<td>
				111</td>
			<td>
				6F</td>
			<td>
				o</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110000</td>
			<td>
				160</td>
			<td>
				112</td>
			<td>
				70</td>
			<td>
				p</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110001</td>
			<td>
				161</td>
			<td>
				113</td>
			<td>
				71</td>
			<td>
				q</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110010</td>
			<td>
				162</td>
			<td>
				114</td>
			<td>
				72</td>
			<td>
				r</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110011</td>
			<td>
				163</td>
			<td>
				115</td>
			<td>
				73</td>
			<td>
				s</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110100</td>
			<td>
				164</td>
			<td>
				116</td>
			<td>
				74</td>
			<td>
				t</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110101</td>
			<td>
				165</td>
			<td>
				117</td>
			<td>
				75</td>
			<td>
				u</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110110</td>
			<td>
				166</td>
			<td>
				118</td>
			<td>
				76</td>
			<td>
				v</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01110111</td>
			<td>
				167</td>
			<td>
				119</td>
			<td>
				77</td>
			<td>
				w</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01111000</td>
			<td>
				170</td>
			<td>
				120</td>
			<td>
				78</td>
			<td>
				x</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01111001</td>
			<td>
				171</td>
			<td>
				121</td>
			<td>
				79</td>
			<td>
				y</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01111010</td>
			<td>
				172</td>
			<td>
				122</td>
			<td>
				7A</td>
			<td>
				z</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01111011</td>
			<td>
				173</td>
			<td>
				123</td>
			<td>
				7B</td>
			<td>
				{</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01111100</td>
			<td>
				174</td>
			<td>
				124</td>
			<td>
				7C</td>
			<td>
				|</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01111101</td>
			<td>
				175</td>
			<td>
				125</td>
			<td>
				7D</td>
			<td>
				}</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr>
			<td>
				01111110</td>
			<td>
				176</td>
			<td>
				126</td>
			<td>
				7E</td>
			<td>
				~</td>
			<td>
				&nbsp;</td>
		</tr>
		<tr class="bg-ctrl">
			<td>
				01111111</td>
			<td>
				177</td>
			<td>
				127</td>
			<td>
				7F</td>
			<td>
				DEL (Delete)</td>
			<td>
				Delete</td>
		</tr>
	</tbody>
</table>
</html>
`
}

export 	function getWebviewContent_rex_lut() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Regex Syntax Cheat Sheet</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 20px;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                h2, h3 {
                    color: #333;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background: white;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                    color: #222;
                }
                th {
                    background: #333;
                    color: white;
                }
                code {
                    background: #eee;
                    padding: 2px 5px;
                    border-radius: 3px;
                    color: #000;
                }
            </style>
        </head>
        <body>
            <h2><strong>Regex Syntax Cheat Sheet</strong></h2>

            <h3>1. Basic matching</h3>
            <table>
                <tr>
                    <th>Syntax</th><th>Description</th><th>Example</th><th>Notes</th>
                </tr>
                <tr>
                    <td><code>a</code></td>
                    <td>Match a literal character</td>
                    <td><code>cat</code> → matches "cat"</td>
                    <td>Case-sensitive (default)</td>
                </tr>
                <tr>
                    <td><code>.</code></td>
                    <td>Match any character (except newline)</td>
                    <td><code>a.c</code> → "abc", "a c"</td>
                    <td>Includes newline with the <code>s</code> flag</td>
                </tr>
                <tr>
                    <td><code>\\</code></td>
                    <td>Escape a special character</td>
                    <td><code>\\.</code> → matches "."</td>
                    <td>To match <code>\\</code> use <code>\\\\</code>; to match <code>.</code> use <code>\\.</code></td>
                </tr>

            </table>

            <h3>2. Quantifiers (repetition)</h3>
            <table>
                <tr>
                    <th>Syntax</th><th>Description</th><th>Example</th><th>Equivalent</th>
                </tr>
                <tr>
                    <td><code>*</code></td>
                    <td>Match the previous element 0 or more times</td>
                    <td><code>a*</code> → "", "a", "aaa"</td>
                    <td><code>{0,}</code></td>
                </tr>
                <tr>
                    <td><code>+</code></td>
                    <td>Match the previous element 1 or more times</td>
                    <td><code>a+</code> → "a", "aaa"</td>
                    <td><code>{1,}</code></td>
                </tr>
                <tr>
                    <td><code>?</code></td>
                    <td>Match the previous element 0 or 1 time</td>
                    <td><code>colou?r</code> → "color", "colour"</td>
                    <td><code>{0,1}</code></td>
                </tr>
                <tr>
                    <td><code>{n}</code></td>
                    <td>Match the previous element exactly n times</td>
                    <td><code>\\d{4}</code> → "2023"</td>
                    <td>Exact match</td>
                </tr>
                <tr>
                    <td><code>{n,}</code></td>
                    <td>Match the previous element at least n times</td>
                    <td><code>\\d{3,}</code> → "123", "4567"</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td><code>{n,m}</code></td>
                    <td>Match the previous element n to m times</td>
                    <td><code>a{2,4}</code> → "aa", "aaaa"</td>
                    <td>Greedy match</td>
                </tr>
                <tr>
                    <td><code>*?</code></td>
                    <td><strong>Lazy mode</strong> (non-greedy match)</td>
                    <td><code>&lt;div&gt;.*?&lt;/div&gt;</code> → shortest match</td>
                    <td>Compare with <code>.*</code></td>
                </tr>
            </table>

            <h3>3. Character classes</h3>
            <table>
                <tr>
                    <th>Syntax</th><th>Description</th><th>Example</th><th>Equivalent</th>
                </tr>
                <tr>
                    <td><code>[abc]</code></td>
                    <td>Match any character inside the brackets</td>
                    <td><code>[aeiou]</code> → matches vowels</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td><code>[^abc]</code></td>
                    <td>Match any character not inside the brackets</td>
                    <td><code>[^0-9]</code> → non-digit characters</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td><code>\\d</code></td>
                    <td>Match a digit (0-9)</td>
                    <td><code>\\d+</code> → "123"</td>
                    <td><code>[0-9]</code></td>
                </tr>
                <tr>
                    <td><code>\\D</code></td>
                    <td>Match a non-digit character</td>
                    <td><code>\\D+</code> → "abc"</td>
                    <td><code>[^0-9]</code></td>
                </tr>
                <tr>
                    <td><code>\\w</code></td>
                    <td>Match a word character (letter, digit, underscore)</td>
                    <td><code>\\w+</code> → "user123"</td>
                    <td><code>[a-zA-Z0-9_]</code></td>
                </tr>
                <tr>
                    <td><code>\\W</code></td>
                    <td>Match a non-word character</td>
                    <td><code>\\W</code> → "@"</td>
                    <td><code>[^\\w]</code></td>
                </tr>
                <tr>
                    <td><code>\\s</code></td>
                    <td>Match a whitespace character (space, tab, etc.)</td>
                    <td><code>\\s+</code> → "   "</td>
                    <td><code>[ \\t\\n\\r\\f]</code></td>
                </tr>
                <tr>
                    <td><code>\\S</code></td>
                    <td>Match a non-whitespace character</td>
                    <td><code>\\S+</code> → "Hello"</td>
                    <td><code>[^\\s]</code></td>
                </tr>
            </table>

            <h3>4. Anchors (boundary matching)</h3>
            <table>
                <tr>
                    <th>Syntax</th><th>Description</th><th>Example</th><th>Use case</th>
                </tr>
                <tr>
                    <td><code>^</code></td>
                    <td>Match the start of a line</td>
                    <td><code>^Start</code> → "Start" at line start</td>
                    <td>Log analysis, data validation</td>
                </tr>
                <tr>
                    <td><code>$</code></td>
                    <td>Match the end of a line</td>
                    <td><code>end$</code> → "end" at line end</td>
                    <td>Same as above</td>
                </tr>
                <tr>
                    <td><code>\\b</code></td>
                    <td>Word boundary (between word and non-word)</td>
                    <td><code>\\bcat\\b</code> → matches "cat", not "category"</td>
                    <td>Exact word matching</td>
                </tr>
                <tr>
                    <td><code>\\B</code></td>
                    <td>Non-word boundary</td>
                    <td><code>\\Bcat\\B</code> → matches "cat" in "category"</td>
                    <td>Substring matching</td>
                </tr>
            </table>
            <h3>5. Groups and references</h3>
            <table>
                <tr>
                    <th>Syntax</th><th>Description</th><th>Example</th><th>Use</th>
                </tr>
                <tr>
                    <td><code>(exp)</code></td>
                    <td>Capturing group, stores the match</td>
                    <td><code>(\\d{4})-(\\d{2})</code> → extract year/month</td>
                    <td>Data extraction, replacement</td>
                </tr>
                <tr>
                    <td><code>(?:exp)</code></td>
                    <td>Non-capturing group (does not store the match)</td>
                    <td><code>(?:\\d{3}-){2}\\d{4}</code> → match a phone number without capturing</td>
                    <td>Performance</td>
                </tr>
                <tr>
                    <td><code>\\1, \\2</code></td>
                    <td>Backreference to a captured group</td>
                    <td><code>(\\w+) \\1</code> → match a repeated word (e.g. "hello hello")</td>
                    <td>Deduplication, validation</td>
                </tr>
            </table>

            <h3>6. Assertions (zero-width)</h3>
            <table>
                <tr>
                    <th>Syntax</th><th>Description</th><th>Example</th><th>Use</th>
                </tr>
                <tr>
                    <td><code>(?=exp)</code></td>
                    <td>Positive lookahead: must be followed by exp</td>
                    <td><code>Windows(?=10|11)</code> → "Windows" followed by 10/11</td>
                    <td>Conditional filtering</td>
                </tr>
                <tr>
                    <td><code>(?!exp)</code></td>
                    <td>Negative lookahead: must not be followed by exp</td>
                    <td><code>\\d{3}(?!\\d)</code> → 3 digits not followed by a digit</td>
                    <td>Data validation</td>
                </tr>
                <tr>
                    <td><code>(?<=exp)</code></td>
                    <td>Positive lookbehind: must be preceded by exp</td>
                    <td><code>(?<=\\$)\\d+</code> → "100" in "$100"</td>
                    <td>Extract specific values</td>
                </tr>
                <tr>
                    <td><code>(?<!exp)</code></td>
                    <td>Negative lookbehind: must not be preceded by exp</td>
                    <td><code>(?<!192\.168)\\d+</code> → exclude intranet IPs</td>
                    <td>Security filtering</td>
                </tr>
            </table>

            <h3>7. Pattern flags</h3>
            <table>
                <tr>
                    <th>Flag</th><th>Description</th><th>Example</th><th>Languages</th>
                </tr>
                <tr>
                    <td><code>i</code></td>
                    <td>Ignore case</td>
                    <td><code>/hello/i</code> → matches "Hello"</td>
                    <td>Common</td>
                </tr>
                <tr>
                    <td><code>g</code></td>
                    <td>Global match (find all matches)</td>
                    <td><code>/a/g</code> → matches every "a"</td>
                    <td>JavaScript, Python</td>
                </tr>
                <tr>
                    <td><code>m</code></td>
                    <td>Multiline mode (^ and $ match line start/end) </td>
                    <td><code>/^start/m</code>  → matches the start of each line</td>
                    <td>Common </td>
                </tr>
                <tr>
                    <td><code>s</code></td>
                    <td>Single-line mode ('.' includes newline) </td>
                    <td><code>/a.b/s</code>  → '.' also matches newline</td>
                    <td>Perl, PHP, Python re.DOTALL </td>
                </tr>
            </table>

            <h3>8. Other advanced syntax</h3>
            <table>
                <tr>
                    <th>Syntax</th><th>Description</th><th>Example</th><th>Engines</th>
                </tr>
                <tr>
                    <td><code>(?R)</code></td>
                    <td>Recursive match (match nested structures)</td>
                    <td><code>\\((?:[^()]|(?R))*\\)</code> → match nested parentheses</td>
                    <td>PCRE</td>
                </tr>
                <tr>
                    <td><code>\\K</code></td>
                    <td>Reset the match start (keep the left side out)</td>
                    <td><code>foo\\Kbar</code> → match "bar" in "foobar"</td>
                    <td>Perl, PCRE</td>
                </tr>
            </table>

            <h3>Cheat sheet tips</h3>
            <ul>
                <li><strong>Precedence</strong>: like arithmetic operators, regex has precedence (e.g. <code>*</code> > concatenation > <code>|</code>).</li>
                <li><strong>Performance</strong>: avoid overusing <code>.*</code>; prefer specific character classes (e.g. use <code>\\d</code> instead of <code>.</code> for digits).</li>
                <li><strong>Online testing</strong>: try <a href="https://regex101.com/" target="_blank">Regex101</a> or <a href="https://regexr.com/" target="_blank">RegExr</a> for live debugging.</li>
                <li><strong>Learning</strong>: practice regularly to build up your skills.</li>
                <li><strong>Reference</strong>: <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions" target="_blank">MDN Regular Expressions</a>.</li>
            </ul>
        </body>
    </html>
  `;


}