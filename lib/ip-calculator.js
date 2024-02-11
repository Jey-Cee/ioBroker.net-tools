const IP_DECIMAL_BASE = 256;
const IP_LOOP_START = 3;
const IP_LOOP_END = 0;

    function calculate(ipStart, ipEnd) {
        let ipStartNum, ipEndNum, ipCurNum;
        let rangeCollection = [];
        try {
            ipStartNum	= convertIpToDecimal(ipStart);
            ipEndNum	= convertIpToDecimal(ipEnd);
        } catch(err) {
            return null;
        }
        if(ipEndNum < ipStartNum) {
            return null;
        }
        ipCurNum = ipStartNum;
        while(ipCurNum <= ipEndNum) {
            let optimalRange = this.getOptimalRange(ipCurNum, ipEndNum);
            if(optimalRange === null) {
                return null;
            }
            rangeCollection.push(optimalRange);
            ipCurNum = optimalRange.ipHigh + 1;
        }
        return rangeCollection;
    }

    /**
     * Calculates a subnet mask from CIDR prefix.
     *
     * @param {string|number} ip IP address ("2.3.4.5")
     * @param {number} prefixSize Number of relevant bits in the subnet mask (24)
     * @return {object|null} Returns null in case of an error, and a subnet data object otherwise.
     *         For details about the subnet data object, see documentation of
     *         getMaskRange()
     * @public
     */
    function calculateSubnetMask(ip, prefixSize) {
        // Convert the IP address to decimal
        let ipAddressInDecimal;

        try {
            ipAddressInDecimal = convertIpToDecimal(ip);
        }
        catch(err) {
            return null;
        }

        // Use the decimal IP address to calculate the subnet mask
        return getMaskRange(ipAddressInDecimal, prefixSize);
    }

    /**
     * Calculates a CIDR prefix from subnet mask.
     *
     * @param {string | number} ip - The IP address (Ex: "2.3.4.5")
     * @param {string | number} subnetMask - The subnet mask for the IP (Ex: "255.255.255.0")
     * @returns {Object | null} - It returns `null` in case of an error, and an object containing the subnet data if successful.
     * @public
     */
    function calculateCIDRPrefix (ip, subnetMask) {
        const IPv4_BIT_COUNT = 32;
        let ipDecimal, subnetMaskDecimal, currentPrefix = 0, updatedPrefix = 0, subnetBitCount;

        function calculateNewPrefix(i) {
            updatedPrefix = (currentPrefix + (1 << (IPv4_BIT_COUNT - (i + 1))) >>> 0);
            if ((subnetMaskDecimal & updatedPrefix) >>> 0 !== updatedPrefix) {
                return i;
            }
            currentPrefix = updatedPrefix;
        }

        try {
            ipDecimal = convertIpToDecimal(ip);
            subnetMaskDecimal = convertIpToDecimal(subnetMask);
        }
        catch (err) {
            return null;
        }

        for (subnetBitCount = 0; subnetBitCount < IPv4_BIT_COUNT; subnetBitCount++) {
            let returnValue = calculateNewPrefix(subnetBitCount);
            if (returnValue !== undefined) {
                subnetBitCount = returnValue;
                break;
            }
        }

        return getMaskRange(ipDecimal, subnetBitCount);
    }

    function getOptimalRange(ipNum, ipEndNum) {
        let prefixSize, optimalRange = null;
        for(prefixSize = 32; prefixSize >= 0; prefixSize--) {
            let maskRange = getMaskRange(ipNum, prefixSize);
            if((maskRange.ipLow === ipNum) && (maskRange.ipHigh <= ipEndNum)) {
                optimalRange = maskRange;
            } else {
                break;
            }
        }
        return optimalRange;
    }

    function getMaskRange(ipNum, prefixSize) {
        const prefixMask = getPrefixMask(prefixSize);
        const lowMask = getMask(32 - prefixSize);
        const ipLow = calculateIpLow(ipNum, prefixMask);
        const ipHigh = calculateIpHigh(ipNum, prefixMask, lowMask);
        const invertedSize = 32 - prefixSize;

        return buildMaskRangeObject(ipLow, ipHigh, prefixMask, invertedSize, lowMask, prefixSize);
    }

    function calculateIpLow(ipNum, prefixMask) {
        return (ipNum & prefixMask) >>> 0;
    }

    function calculateIpHigh(ipNum, prefixMask, lowMask) {
        return ((ipNum & prefixMask) >>> 0) + lowMask >>> 0;
    }

    function buildMaskRangeObject(ipLow, ipHigh, prefixMask, invertedSize, lowMask, prefixSize) {
        return {
            ipLow: ipLow,
            ipLowStr: toString(ipLow),
            ipHigh: ipHigh,
            ipHighStr: toString(ipHigh),
            prefixMask: prefixMask,
            prefixMaskStr: toString(prefixMask),
            prefixSize: prefixSize,
            invertedMask: lowMask,
            invertedMaskStr: toString(lowMask),
            invertedSize: invertedSize
        };
    }

    function getPrefixMask ( prefixSize )
    {
        let mask = 0;
        for(let i = 0; i < prefixSize; i++ )
        {
            let maskBit = ( 1 << ( 32 - ( i + 1 ) ) ) >>> 0;
            mask += maskBit;
        }
        return mask;
    }

    /**
     * Returns a bitmask with maskSize rightmost bits set to one
     *
     * @param {Number} maskSize Number of bits to be set
     * @return {Number} Returns the bitmask
     * @private
     */
    function getMask(maskSize) {
        let bitMask = 0;
        const BASE = 1;
        const DEFAULT_VALUE = 0;

        const raisePower = function(bitIndex) {
            return (BASE << bitIndex) >>> DEFAULT_VALUE;
        }

        for(let bitIndex = 0; bitIndex < maskSize; bitIndex++) {
            bitMask += raisePower(bitIndex);
        }

        return bitMask;
    }

    /**
     * Check if a part of an IP address is valid
     * @param {string} part
     * @returns {boolean}
     * @private
     */
    function isValidIpPart(part) {
        let n = parseInt(part, 10);
        return n >= 0 && n <= 255;
    }

    /**
     * Test whether string is an IP address
     * @param {string} ip
     * @returns {boolean}
     * @public
     */
    function isIp(ip) {
        if (typeof ip !== 'string') {
            return false;
        }

        let parts = ip.match(/^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/);

        if (parts === null) {
            return false;
        }

        for (let i = 1; i <= 4; i++) {
            if (!isValidIpPart(parts[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Test whether number is an IP address
     * @param {number} ipNum
     * @returns {boolean}
     * @public
     */
    function isDecimalIp( ipNum )
    {
        return (
            ( typeof ipNum === 'number' ) && // is this a number?
            ( ipNum % 1 === 0 ) && // does the number have a decimal place?
            ( ipNum >= 0 ) &&
            ( ipNum <= 4294967295 )
        );
    }

    /**
     * Converts string formatted IPs to decimal representation
     *
     * @param {string|number} ipString IP address in string format. If a decimal representation given, it is returned unmodified.
     * @return {number} Returns the IP address in decimal format
     * @throws {Error} Throws an error, if `ipString` does not contain an IP address.
     * @private
     */
    function convertIpToDecimal(ipString) {
        const BASE = 256;

        if(typeof ipString === 'number' && isDecimalIp(ipString)) {
            return ipString;
        }

        if(!isIp(ipString)) {
            throw new Error('Not an IP address: ' + ipString);
        }

        const ipParts = ipString.split('.').map(part => +part);

        return calculateIpFromParts(ipParts, BASE);
    }

    /**
     * Calculate the decimal representation of IP from parts
     *
     * @param {Array} ipParts
     * @param {number} base
     * @return {number}
     * @private
     */
    function calculateIpFromParts(ipParts, base) {
        return ((((ipParts[0] * base + ipParts[1]) * base) + ipParts[2]) * base) + ipParts[3];
    }

    /**
     * Converts decimal IPs to string representation
     *
     * @link http://javascript.about.com/library/blipconvert.htm
     * @param {number} ipNum IP address in decimal format. If a string representation is given, it is returned unmodified.
     * @return {string} Returns the IP address in string format
     * @throws {Error} Throws an error if `ipNum` is out of range, not a decimal, or not a number
     * @private
     */

    function calculateIpAddress(ipNum) {
        let d = ipNum % IP_DECIMAL_BASE;
        ipNum = Math.floor(ipNum / IP_DECIMAL_BASE);

        for (let i = IP_LOOP_START; i > IP_LOOP_END; i--) {
            d = ipNum % IP_DECIMAL_BASE + '.' + d;
            ipNum = Math.floor(ipNum / IP_DECIMAL_BASE);
        }
        return d;
    }

    function toString(ipNum) {
        if ((typeof ipNum === 'string') && (isIp(ipNum) === true)) {
            return ipNum;
        }
        if (isDecimalIp(ipNum) === false) {
            throw new Error('Not a numeric IP address: ' + ipNum);
        }
        let d = ipNum % IP_DECIMAL_BASE;
        return calculateIpAddress(ipNum);
    }


module.exports = {
    calculateSubnetMask: calculateSubnetMask
}