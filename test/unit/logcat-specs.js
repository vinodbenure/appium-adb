import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as teen_process from 'teen_process';
import events from 'events';
import Logcat from '../../lib/logcat';
import { withMocks } from 'appium-test-support';


chai.use(chaiAsPromised);

describe('logcat', function () {
  let adb = {path: 'dummyPath', defaultArgs: []};
  let logcat = new Logcat({adb, debug: false, debugTrace: false});

  describe('startCapture', withMocks({teen_process}, function (mocks) {
    it('should correctly call subprocess and should resolve promise', async function () {
      let conn = new events.EventEmitter();
      conn.start = () => { };
      mocks.teen_process.expects("SubProcess")
        .once().withExactArgs('dummyPath', ['logcat', '-v', 'threadtime'])
        .returns(conn);
      setTimeout(function () {
        conn.emit('lines-stdout', ['- beginning of system\r']);
      }, 0);
      await logcat.startCapture();
      let logs = logcat.getLogs();
      logs.should.have.length.above(0);
      mocks.teen_process.verify();
    });
    it('should correctly call subprocess and should reject promise', async function () {
      let conn = new events.EventEmitter();
      conn.start = () => { };
      mocks.teen_process.expects("SubProcess")
        .once().withExactArgs('dummyPath', ['logcat', '-v', 'threadtime'])
        .returns(conn);
      setTimeout(function () {
        conn.emit('lines-stderr', ['execvp()']);
      }, 0);
      await logcat.startCapture().should.eventually.be.rejectedWith('Logcat');
      mocks.teen_process.verify();
    });
    it('should correctly call subprocess and should resolve promise if it fails on startup', async function () {
      let conn = new events.EventEmitter();
      conn.start = () => { };
      mocks.teen_process.expects("SubProcess")
        .once().withExactArgs('dummyPath', ['logcat', '-v', 'threadtime'])
        .returns(conn);
      setTimeout(function () {
        conn.emit('lines-stderr', ['something']);
      }, 0);
      await logcat.startCapture().should.eventually.not.be.rejectedWith('Logcat');
      mocks.teen_process.verify();
    });
  }));

  describe('clear', withMocks({teen_process}, function (mocks) {
    it('should call logcat clear', async function () {
      mocks.teen_process.expects('exec')
        .once().withExactArgs(adb.path, adb.defaultArgs.concat(['logcat', '-c']));
      await logcat.clear();
      mocks.teen_process.verify();
    });
    it('should not fail if logcat clear fails', async function () {
      mocks.teen_process.expects('exec')
        .once().withExactArgs(adb.path, adb.defaultArgs.concat(['logcat', '-c']))
        .throws('Failed to clear');
      await logcat.clear().should.eventually.not.be.rejected;
      mocks.teen_process.verify();
    });
  }));
});
